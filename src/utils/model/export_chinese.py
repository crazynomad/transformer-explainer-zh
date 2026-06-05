# -*- coding: utf-8 -*-
"""
导出「中文版」GPT-2 用于 Transformer Explainer。

与英文管线（export_to_onnx.py）的区别：
  1. 加载的是中文模型 uer/gpt2-chinese-cluecorpussmall（标准 GPT2LMHeadModel，
     12 层 / 12 头 / 768 维，词表 21128，字符级，无 byte-level 乱码问题）。
  2. 词表大小从 50257 改为 21128（其余结构与英文 GPT-2 完全一致）。
  3. 额外导出一份 transformers.js 兼容的分词器到 static/models/gpt2-chinese/，
     这样浏览器端无需联网即可加载中文分词器。
  4. 直接把导出的 ONNX 切块到 static/model-v2/（覆盖英文 chunk），并打印 chunk 数 N。

本脚本【自包含】：不修改 model.py / export_to_onnx.py（保持与上游 diff 干净），
但复用 model.py 里能输出「中间注意力张量」的 GPT 结构。

运行要求：有网络 + Python3 + PyTorch。请在仓库根目录执行：
    python3 src/utils/model/export_chinese.py

依赖：
    pip install torch transformers onnx
"""

import os
import sys
import torch

# 让脚本无论从哪里调用，都能 import 同目录下的 model.py
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from model import GPT, GPTConfig  # noqa: E402

# ----------------------------------------------------------------------------
# 配置
# ----------------------------------------------------------------------------
HF_MODEL = "uer/gpt2-chinese-cluecorpussmall"   # 中文 GPT-2（12/12/768, vocab 21128）
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", ".."))

PARAMS_DIR = os.path.join(REPO_ROOT, "src", "utils", "model", "params_output")
ONNX_PATH = os.path.join(PARAMS_DIR, "gpt2.onnx")            # 与 chunk 命名保持一致
CHUNK_DIR = os.path.join(REPO_ROOT, "static", "model-v2")    # 覆盖英文 chunk
CHUNK_PREFIX = os.path.join(CHUNK_DIR, "gpt2.onnx")
TOKENIZER_DIR = os.path.join(REPO_ROOT, "static", "models", "gpt2-chinese")  # transformers.js 本地分词器
CHUNK_SIZE = 10 * 1024 * 1024  # 10MB，与英文一致（GitHub Pages 单文件限制）

# 用于 ONNX 导出的示例输入（任意一句中文即可，仅决定 trace 时的形状）
SAMPLE_TEXT = "人工智能正在改变世界"


def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)
        print(f"  创建目录: {path}")


# ----------------------------------------------------------------------------
# 把 HF 的 GPT2LMHeadModel 权重映射进 nanoGPT 结构（复用英文管线的转置规则）
# ----------------------------------------------------------------------------
def load_chinese_gpt():
    from transformers import GPT2LMHeadModel

    print(f"[1/5] 从 HuggingFace 加载中文模型: {HF_MODEL}")
    hf = GPT2LMHeadModel.from_pretrained(HF_MODEL)
    hf.eval()
    cfg = hf.config
    print(f"      n_layer={cfg.n_layer} n_head={cfg.n_head} "
          f"n_embd={cfg.n_embd} vocab_size={cfg.vocab_size} "
          f"n_positions={cfg.n_positions}")

    config = GPTConfig(
        block_size=cfg.n_positions,   # 1024
        vocab_size=cfg.vocab_size,    # 21128
        n_layer=cfg.n_layer,          # 12
        n_head=cfg.n_head,            # 12
        n_embd=cfg.n_embd,            # 768
        dropout=0.0,
        bias=True,
    )
    model = GPT(config)
    sd = model.state_dict()
    sd_keys = [k for k in sd.keys() if not k.endswith(".attn.bias")]  # 丢弃因果掩码 buffer

    sd_hf = hf.state_dict()
    sd_keys_hf = [k for k in sd_hf.keys()
                  if not k.endswith(".attn.masked_bias")
                  and not k.endswith(".attn.bias")]

    # OpenAI 的 Conv1D 权重需要转置成普通 Linear
    transposed = ["attn.c_attn.weight", "attn.c_proj.weight",
                  "mlp.c_fc.weight", "mlp.c_proj.weight"]

    assert len(sd_keys_hf) == len(sd_keys), \
        f"权重键数量不匹配: hf={len(sd_keys_hf)} vs nanoGPT={len(sd_keys)}（架构不一致？）"

    print("[2/5] 拷贝权重（含 Conv1D 转置）...")
    for k in sd_keys_hf:
        if any(k.endswith(w) for w in transposed):
            assert sd_hf[k].shape[::-1] == sd[k].shape, f"形状不匹配(转置): {k}"
            with torch.no_grad():
                sd[k].copy_(sd_hf[k].t())
        else:
            assert sd_hf[k].shape == sd[k].shape, f"形状不匹配: {k}"
            with torch.no_grad():
                sd[k].copy_(sd_hf[k])

    model.eval()
    return model


# ----------------------------------------------------------------------------
# 与 export_to_onnx.py 相同的 wrapper：把嵌套 dict 里的中间张量摊平成具名输出
# ----------------------------------------------------------------------------
class Wrapper(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model
        self.layer_num = model.config.n_layer
        self.head_num = model.config.n_head

    def forward(self, input):
        outputs = self.model(input)
        extracted = []
        for i in range(self.layer_num):
            for j in range(self.head_num):
                head = outputs["block"][f"block_{i}"]["attn"][f"head_{j}"]
                extracted.extend([
                    head["attn"],
                    head["attn_scaled"],
                    head["attn_masked"],
                    head["attn_softmax"],
                    head["attn_dropout"],
                ])
        extracted.append(outputs["linear"]["output"])
        return tuple(extracted)


def export_onnx(model, dummy_input):
    print("[3/5] 导出 ONNX（含每层每头的中间注意力张量）...")
    wrapped = Wrapper(model)

    output_names = [
        f"block_{i}_attn_head_{j}_{suffix}"
        for i in range(model.config.n_layer)
        for j in range(model.config.n_head)
        for suffix in ["attn", "attn_scaled", "attn_masked", "attn_softmax", "attn_dropout"]
    ]
    output_names.append("linear_output")

    ensure_dir(PARAMS_DIR)
    torch.onnx.export(
        wrapped,
        dummy_input,
        ONNX_PATH,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=["input"],
        output_names=output_names,
        dynamic_axes={
            "input": {0: "0", 1: "1"},
            **{name: {0: "0", 1: "1", 2: "2"}
               for name in output_names if name != "linear_output"},
            "linear_output": {0: "0", 1: "1", 2: "2"},
        },
    )
    size_mb = os.path.getsize(ONNX_PATH) / 1024 / 1024
    print(f"      已导出: {ONNX_PATH} ({size_mb:.1f} MB)")


def save_tokenizer():
    """保存 transformers.js 兼容的分词器到 static/models/gpt2-chinese/。

    BertTokenizerFast 会写出 tokenizer.json + tokenizer_config.json，
    @xenova/transformers 可直接本地加载（无需联网）。
    """
    from transformers import AutoTokenizer

    print(f"[4/5] 保存浏览器端分词器到: {TOKENIZER_DIR}")
    ensure_dir(TOKENIZER_DIR)
    tok = AutoTokenizer.from_pretrained(HF_MODEL)  # BertTokenizerFast（字符级中文）
    tok.save_pretrained(TOKENIZER_DIR)
    has_json = os.path.exists(os.path.join(TOKENIZER_DIR, "tokenizer.json"))
    print(f"      tokenizer.json 是否生成: {has_json}"
          + ("" if has_json else "  ← 警告：未生成 fast tokenizer.json，transformers.js 可能无法加载"))
    return tok


def chunk_onnx():
    print(f"[5/5] 切块到: {CHUNK_DIR}")
    ensure_dir(CHUNK_DIR)
    # 清掉旧的英文 chunk，避免残留多余的 .part*
    removed = 0
    for fn in os.listdir(CHUNK_DIR):
        if fn.startswith("gpt2.onnx.part"):
            os.remove(os.path.join(CHUNK_DIR, fn))
            removed += 1
    if removed:
        print(f"      已删除 {removed} 个旧 chunk")

    n = 0
    with open(ONNX_PATH, "rb") as f:
        while True:
            chunk = f.read(CHUNK_SIZE)
            if not chunk:
                break
            with open(f"{CHUNK_PREFIX}.part{n}", "wb") as out:
                out.write(chunk)
            n += 1
    print(f"      共生成 {n} 个 chunk")
    return n


def main():
    model = load_chinese_gpt()
    tok = save_tokenizer()

    # 用真实分词器生成一个合法的示例输入（不加特殊 token，与前端一致）
    ids = tok.encode(SAMPLE_TEXT, add_special_tokens=False)
    dummy_input = torch.tensor([ids], dtype=torch.long)
    print(f"      示例输入 '{SAMPLE_TEXT}' -> {len(ids)} tokens: {ids}")

    export_onnx(model, dummy_input)
    n = chunk_onnx()

    print("\n========================================================")
    print("✅ 完成！下一步：")
    print(f"   1) 把这个 chunk 数告诉 Claude： N = {n}")
    print(f"      （需要更新前端 modelMetaMap['gpt2-zh'].chunkTotal）")
    print("   2) 翻开关：src/store/index.ts 里 ACTIVE_MODEL 改为 'gpt2-zh'")
    print("   3) npm run dev 验证中文输入")
    print("========================================================")


if __name__ == "__main__":
    main()
