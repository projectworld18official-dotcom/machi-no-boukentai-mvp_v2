"""
Phase 2e: Gemini Imagen API を使ったキャラ立ち絵・スキン・バトル背景生成スクリプト

使い方:
    C:\Python314\python.exe scripts/generate_images.py

出力:
    public/characters/          : Tier1 採用キャラ立ち絵 5枚
    public/characters/alternates: Tier1 alternates 15枚
    public/skins/               : Tier2 ゴールド/レインボースキン 10枚
    public/battle_backgrounds/  : Tier4 採用バトル背景 6枚
    public/battle_backgrounds/alternates: Tier4 alternates 6枚
    public/placeholder.png      : フォールバック用グレー画像

注意:
    GEMINI_API_KEY が .env に存在することを確認してから実行すること。
"""

import os
import sys
import time
import re
import io
import shutil
import traceback
from pathlib import Path
from datetime import datetime

# dotenv は python-dotenv パッケージ
# プロジェクト直下の .env を優先し、なければ親ディレクトリの .env を読み込む
try:
    from dotenv import load_dotenv
    _env_path = Path(".env")
    if not _env_path.exists():
        _env_path = Path("../.env")
    if _env_path.exists():
        load_dotenv(str(_env_path), override=True)
    else:
        load_dotenv(override=True)  # 環境変数のみ
except ImportError:
    print("⚠️ python-dotenv が見つかりません。pip install python-dotenv で入れてください。")

# PIL は Pillow パッケージ
try:
    from PIL import Image, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️ Pillow が見つかりません。pip install Pillow で入れてください。")

# ============================================================
# 設定
# ============================================================
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
IMAGEN_MODEL = "imagen-4.0-fast-generate-001"  # Imagen 4 Fast、$0.02/画像
JUDGE_MODEL = "gemini-2.0-flash"          # 判定用テキスト+ビジョンモデル

CHARS_DIR = Path("public/characters")
SKINS_DIR = Path("public/skins")
BGSDIR = Path("public/battle_backgrounds")
LOG_DIR = Path("99_briefings")
LOG_FILE = LOG_DIR / "last_result_phase2e_imagegen.log"
ERROR_LOG = LOG_DIR / "generation_errors.log"
PLACEHOLDER = Path("public/placeholder.png")

# 生成間インターバル(秒)
SLEEP_BETWEEN = 2
# レート制限時リトライ待機(秒)
RATE_LIMIT_WAIT = 30
MAX_RETRIES = 3

# ============================================================
# ログ & エラーログ
# ============================================================
_log_lines: list[str] = []

def _print(msg: str) -> None:
    """標準出力と LOG_FILE の両方に書き込む。"""
    print(msg, flush=True)
    _log_lines.append(msg)


def flush_log() -> None:
    """溜めたログを LOG_FILE に書き出す。"""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(_log_lines))


def log_error(category: str, msg: str) -> None:
    """エラーを generation_errors.log に記録する。"""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with open(ERROR_LOG, "a", encoding="utf-8") as f:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        f.write(f"[{timestamp}] [{category}] {msg}\n")
    _print(f"⚠️ エラー記録: [{category}] {msg}")


# ============================================================
# Placeholder 画像生成
# ============================================================
def create_placeholder() -> None:
    """フォールバック用の灰色 128x128 PNG を生成する。"""
    if not PIL_AVAILABLE:
        _print("⚠️ Pillow がないため placeholder.png を生成できません。")
        return
    PLACEHOLDER.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (128, 128), color=(128, 128, 128))
    draw = ImageDraw.Draw(img)
    draw.text((10, 50), "NO IMG", fill=(200, 200, 200))
    img.save(str(PLACEHOLDER))
    _print(f"✅ placeholder.png 生成: {PLACEHOLDER}")


# ============================================================
# Gemini クライアント初期化
# ============================================================
def get_genai_client():
    """
    google-genai (genai) クライアントを返す。
    失敗した場合は None を返す。
    """
    try:
        from google import genai as _genai
        client = _genai.Client(api_key=GEMINI_API_KEY)
        return client, "google-genai"
    except ImportError:
        pass

    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        return genai, "google-generativeai"
    except ImportError:
        pass

    return None, None


# ============================================================
# 単一画像生成
# ============================================================
def generate_single_image(client, sdk_type: str, prompt: str, aspect_ratio: str = "9:16", retries: int = MAX_RETRIES) -> bytes | None:
    """
    Imagen API で1枚の画像を生成してバイナリを返す。
    失敗時は None を返す。

    Parameters
    ----------
    client      : genai.Client または google.generativeai モジュール
    sdk_type    : "google-genai" または "google-generativeai"
    prompt      : 画像生成プロンプト
    aspect_ratio: "9:16" or "16:9"
    retries     : リトライ上限
    """
    for attempt in range(1, retries + 1):
        try:
            time.sleep(SLEEP_BETWEEN)

            if sdk_type == "google-genai":
                # google-genai SDK (v0.8+)
                from google.genai import types as genai_types
                response = client.models.generate_images(
                    model=IMAGEN_MODEL,
                    prompt=prompt,
                    config=genai_types.GenerateImagesConfig(
                        number_of_images=1,
                        aspect_ratio=aspect_ratio,
                        safety_filter_level="block_low_and_above",
                        person_generation="allow_adult",
                    ),
                )
                if response.generated_images:
                    return response.generated_images[0].image.image_bytes
                _print(f"⚠️ 画像が生成されませんでした (attempt {attempt})")
                return None

            else:
                # google-generativeai SDK (旧)
                # Imagen は ImageGenerationModel 経由
                model = client.ImageGenerationModel(model_name=IMAGEN_MODEL)
                response = model.generate_images(
                    prompt=prompt,
                    number_of_images=1,
                )
                if response.images:
                    buf = io.BytesIO()
                    response.images[0]._pil_image.save(buf, format="PNG")
                    return buf.getvalue()
                _print(f"⚠️ 画像が生成されませんでした (attempt {attempt})")
                return None

        except Exception as e:
            err_str = str(e)
            # 認証エラーは即停止
            if "UNAUTHENTICATED" in err_str or "API_KEY_INVALID" in err_str or "401" in err_str:
                _print(f"🚨 認証エラー: {err_str}")
                _print("GEMINI_API_KEY を確認してください。処理を停止します。")
                sys.exit(1)
            # レート制限 or 503 はリトライ
            if "429" in err_str or "503" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                _print(f"⏳ レート制限/503 エラー (attempt {attempt}/{retries}): {err_str[:120]}")
                if attempt < retries:
                    _print(f"   {RATE_LIMIT_WAIT}秒待機してリトライ...")
                    time.sleep(RATE_LIMIT_WAIT)
                    continue
            else:
                _print(f"⚠️ 画像生成エラー (attempt {attempt}/{retries}): {err_str[:200]}")
                if attempt < retries:
                    time.sleep(SLEEP_BETWEEN * 2)
                    continue

    return None


def generate_multi_images(client, sdk_type: str, prompt: str, count: int, aspect_ratio: str = "9:16") -> list[bytes]:
    """
    複数枚まとめて生成する（可能であれば1回のAPIコール）。
    失敗分は placeholder バイナリで埋める。
    """
    results: list[bytes | None] = []

    if sdk_type == "google-genai":
        # 最大4枚まで一括生成可能
        try:
            time.sleep(SLEEP_BETWEEN)
            from google.genai import types as genai_types
            response = client.models.generate_images(
                model=IMAGEN_MODEL,
                prompt=prompt,
                config=genai_types.GenerateImagesConfig(
                    number_of_images=min(count, 4),
                    aspect_ratio=aspect_ratio,
                    safety_filter_level="block_low_and_above",
                    person_generation="allow_adult",
                ),
            )
            for gi in response.generated_images:
                results.append(gi.image.image_bytes)
        except Exception as e:
            err_str = str(e)
            if "UNAUTHENTICATED" in err_str or "API_KEY_INVALID" in err_str or "401" in err_str:
                _print(f"🚨 認証エラー: {err_str}")
                sys.exit(1)
            _print(f"⚠️ 複数画像生成失敗: {err_str[:200]}")
    else:
        # 旧 SDK: 1枚ずつ生成
        for _ in range(count):
            img_bytes = generate_single_image(client, sdk_type, prompt, aspect_ratio)
            results.append(img_bytes)

    # count 枚に満たない分を placeholder で補完
    placeholder_bytes = _load_placeholder_bytes()
    while len(results) < count:
        results.append(placeholder_bytes)

    return [r if r is not None else placeholder_bytes for r in results]


def _load_placeholder_bytes() -> bytes:
    """placeholder.png のバイナリを返す。なければ最小限の PNG バイナリを生成。"""
    if PLACEHOLDER.exists():
        return PLACEHOLDER.read_bytes()
    if PIL_AVAILABLE:
        img = Image.new("RGB", (128, 128), color=(128, 128, 128))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    # 最小 1x1 グレー PNG バイナリ (PNG マジックバイト + IHDR + IDAT + IEND)
    return (
        b"\x89PNG\r\n\x1a\n"
        b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02"
        b"\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
        b"\x00\x11\x00\x01\xe5\xed\xca\xd3\x00\x00\x00\x00IEND\xaeB`\x82"
    )


# ============================================================
# 画像保存
# ============================================================
def save_image(data: bytes, path: Path) -> None:
    """バイナリを指定パスに保存する。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    _print(f"   💾 保存: {path}")


# ============================================================
# 判定: Gemini で N枚から最良を選ぶ
# ============================================================
def judge_best(client, sdk_type: str, images_bytes: list[bytes], context_description: str) -> int:
    """
    複数画像から最も子供向けRPGに適した1枚のインデックス(0始まり)を返す。
    判定に失敗した場合は 0 を返す。
    """
    if len(images_bytes) == 1:
        return 0

    judge_prompt = f"""あなたは子供向けスマホRPGのアートディレクターです。
以下の {len(images_bytes)} 枚の画像を見て、「{context_description}」として最も適切な1枚を選んでください。

選定基準:
- 子供（4〜12歳）に親しみやすいか
- キャラクターが鮮明に描かれているか
- 色彩が明るくポップか
- ゲームUIと合わせやすいか（背景が単純、またはホワイト背景）

必ず「採用: N番」の形式で回答してください（N は 1〜{len(images_bytes)} の整数）。
採用理由も1文で添えてください。"""

    try:
        if sdk_type == "google-genai":
            import PIL.Image
            pil_images = []
            for b in images_bytes:
                try:
                    pil_images.append(PIL.Image.open(io.BytesIO(b)))
                except Exception:
                    # 壊れた画像はスキップ用 placeholder
                    pil_images.append(PIL.Image.new("RGB", (128, 128), color=(128, 128, 128)))

            contents = [judge_prompt] + pil_images
            response = client.models.generate_content(
                model=JUDGE_MODEL,
                contents=contents,
            )
            answer = response.text

        else:
            # google-generativeai
            import google.generativeai as genai_old
            import PIL.Image

            model = genai_old.GenerativeModel(JUDGE_MODEL)
            pil_images = []
            for b in images_bytes:
                try:
                    pil_images.append(PIL.Image.open(io.BytesIO(b)))
                except Exception:
                    pil_images.append(PIL.Image.new("RGB", (128, 128), color=(128, 128, 128)))

            response = model.generate_content([judge_prompt] + pil_images)
            answer = response.text

        _print(f"   🤖 Gemini 判定: {answer.strip()[:200]}")

        # 「採用: N番」または「採用:N」を抽出
        match = re.search(r"採用[：:]\s*(\d+)番?", answer)
        if match:
            idx = int(match.group(1)) - 1  # 0始まりに変換
            idx = max(0, min(idx, len(images_bytes) - 1))
            return idx

        _print("   ⚠️ 採用番号を抽出できませんでした。0番(先頭)を採用します。")
        return 0

    except Exception as e:
        _print(f"   ⚠️ 判定エラー: {str(e)[:200]}。0番(先頭)を採用します。")
        return 0


# ============================================================
# Tier 1: キャラ立ち絵 (5キャラ × 4案生成 → 判定 → 採用1枚 + alternates 3枚)
# ============================================================

TIER1_CHARS = {
    "hero": {
        "label": "主人公",
        "prompt_extra": "4〜10歳の性別中立な児童キャラクター、青系の冒険服、明るく好奇心旺盛な表情、シンプルなデザイン"
    },
    "warrior_you": {
        "label": "戦士ヨウ",
        "prompt_extra": "男児風キャラクター、赤系の鎧、剣を持ち、勇敢で前向きな表情、格好よくシンプルなデザイン"
    },
    "monk_daichi": {
        "label": "モンクダイチ",
        "prompt_extra": "男児風キャラクター、オレンジ系の道着、素手構え、力強くまっすぐな表情、シンプルなデザイン"
    },
    "mage_nayu": {
        "label": "魔法使いナユ",
        "prompt_extra": "女児風キャラクター、青系のローブ、杖を持ち、知的で優しい表情、かわいくシンプルなデザイン"
    },
    "youtuber": {
        "label": "ユーチューバー",
        "prompt_extra": "性別中立なキャラクター、ピンクまたは黄色系のカジュアル服、スマートフォンまたはカメラを持ち、明るくフレンドリーな表情"
    }
}

TIER1_BASE_PROMPT = (
    "日本のスマホRPGの子供向けキャラクター立ち絵、全身、ホワイト背景、"
    "鮮やかでポップなアニメ調、目が大きく親しみやすい表情、"
    "{extra}、高品質、シンプルで視認性の高いデザイン"
)


def generate_tier1(client, sdk_type: str) -> dict:
    """Tier1 キャラ立ち絵を生成・判定・保存する。"""
    _print("\n" + "=" * 60)
    _print("🎨 Tier 1: キャラ立ち絵 生成開始")
    _print("=" * 60)

    summary = {"adopted": 0, "alternates": 0, "errors": 0}
    adoption_notes = {}

    for char_id, char_info in TIER1_CHARS.items():
        _print(f"\n📌 {char_info['label']} ({char_id}) 生成中...")
        prompt = TIER1_BASE_PROMPT.replace("{extra}", char_info["prompt_extra"])

        # 4案まとめて生成
        images = generate_multi_images(client, sdk_type, prompt, 4, "9:16")

        # placeholder を使った枚数 = エラー扱い
        placeholder_b = _load_placeholder_bytes()
        error_count = sum(1 for img in images if img == placeholder_b)
        if error_count > 0:
            _print(f"   ⚠️ {error_count} 枚が placeholder に置き換えられました")
            log_error("tier1", f"{char_id}: {error_count}/4 枚生成失敗")
            summary["errors"] += error_count

        # 判定
        context = f"{char_info['label']}のキャラクター立ち絵（子供向けRPG）"
        best_idx = judge_best(client, sdk_type, images, context)
        adoption_notes[char_id] = f"採用{best_idx + 1}番"

        # 採用画像保存
        adopted_path = CHARS_DIR / f"{char_id}.png"
        save_image(images[best_idx], adopted_path)
        summary["adopted"] += 1

        # alternates 保存
        for i, img_bytes in enumerate(images):
            if i == best_idx:
                continue
            alt_path = CHARS_DIR / "alternates" / f"{char_id}_alt{i + 1}.png"
            save_image(img_bytes, alt_path)
            summary["alternates"] += 1

    _print(f"\n✅ Tier1 完了: 採用 {summary['adopted']} 枚 / alternates {summary['alternates']} 枚 / エラー {summary['errors']} 枚")
    return {**summary, "notes": adoption_notes}


# ============================================================
# Tier 2: ★4 スキン (5キャラ × 2種: gold/rainbow → 判定なし)
# ============================================================

TIER2_SKIN_PROMPTS = {
    "hero_gold": {
        "base_char": "主人公（青系の冒険服の4〜10歳性別中立児童キャラクター）",
        "skin": "ゴールド版"
    },
    "hero_rainbow": {
        "base_char": "主人公（青系の冒険服の4〜10歳性別中立児童キャラクター）",
        "skin": "レインボー版"
    },
    "warrior_you_gold": {
        "base_char": "戦士ヨウ（赤系の鎧に剣を持つ男児風キャラクター）",
        "skin": "ゴールド版"
    },
    "warrior_you_rainbow": {
        "base_char": "戦士ヨウ（赤系の鎧に剣を持つ男児風キャラクター）",
        "skin": "レインボー版"
    },
    "monk_daichi_gold": {
        "base_char": "モンクダイチ（オレンジ道着の男児風キャラクター）",
        "skin": "ゴールド金道着版"
    },
    "monk_daichi_rainbow": {
        "base_char": "モンクダイチ（オレンジ道着の男児風キャラクター）",
        "skin": "レインボー虹道着版"
    },
    "mage_nayu_gold": {
        "base_char": "魔法使いナユ（青系ローブに杖の女児風キャラクター）",
        "skin": "ゴールド版"
    },
    "mage_nayu_rainbow": {
        "base_char": "魔法使いナユ（青系ローブに杖の女児風キャラクター）",
        "skin": "レインボー版"
    },
    "youtuber_gold": {
        "base_char": "ユーチューバー（カジュアル服にスマホを持つ性別中立キャラクター）",
        "skin": "ゴールド版"
    },
    "youtuber_rainbow": {
        "base_char": "ユーチューバー（カジュアル服にスマホを持つ性別中立キャラクター）",
        "skin": "レインボー版"
    },
}

TIER2_GOLD_TEMPLATE = (
    "日本のスマホRPGの子供向けキャラクター立ち絵、全身、ホワイト背景、"
    "鮮やかでポップなアニメ調、目が大きく親しみやすい表情、"
    "{base_char}、"
    "元のキャラクターの色をゴールド系に変更した特別版、輝く金色のオーラ、特別感のある豪華なデザイン、高品質"
)

TIER2_RAINBOW_TEMPLATE = (
    "日本のスマホRPGの子供向けキャラクター立ち絵、全身、ホワイト背景、"
    "鮮やかでポップなアニメ調、目が大きく親しみやすい表情、"
    "{base_char}、"
    "服や髪に虹色のグラデーション（赤橙黄緑青紫）を適用した特別版、華やかで明るいデザイン、高品質"
)


def generate_tier2(client, sdk_type: str) -> dict:
    """Tier2 ゴールド/レインボースキンを生成・保存する（判定なし）。"""
    _print("\n" + "=" * 60)
    _print("🌟 Tier 2: ★4 スキン生成開始")
    _print("=" * 60)

    summary = {"adopted": 0, "errors": 0}

    for skin_id, skin_info in TIER2_SKIN_PROMPTS.items():
        _print(f"\n📌 {skin_id} 生成中...")

        if "gold" in skin_id:
            prompt = TIER2_GOLD_TEMPLATE.replace("{base_char}", skin_info["base_char"])
        else:
            prompt = TIER2_RAINBOW_TEMPLATE.replace("{base_char}", skin_info["base_char"])

        img_bytes = generate_single_image(client, sdk_type, prompt, "9:16")

        if img_bytes is None:
            _print(f"   ⚠️ 生成失敗。placeholder を使用します。")
            log_error("tier2", f"{skin_id}: 生成失敗")
            img_bytes = _load_placeholder_bytes()
            summary["errors"] += 1

        save_image(img_bytes, SKINS_DIR / f"{skin_id}.png")
        summary["adopted"] += 1

    _print(f"\n✅ Tier2 完了: 採用 {summary['adopted']} 枚 / エラー {summary['errors']} 枚")
    return summary


# ============================================================
# Tier 4: バトル背景 (6ステージ × 2案生成 → 判定 → 採用1枚 + alternates 1枚)
# ============================================================

TIER4_STAGES = {
    "stage1": {
        "label": "みなとみらい",
        "prompt": "横浜みなとみらい風の風景、高層ビル群、ベイブリッジ遠景、横浜の港、夕暮れの空"
    },
    "stage2": {
        "label": "中華街",
        "prompt": "横浜中華街風の風景、赤い中華門、カラフルな提灯、中華料理店の看板、賑やかな通り"
    },
    "stage3": {
        "label": "元町・山手",
        "prompt": "横浜元町・山手風の風景、西洋館、石畳の坂道、木々の緑、歴史的な洋風建築"
    },
    "stage4": {
        "label": "山下公園",
        "prompt": "横浜山下公園風の風景、海辺、広い芝生、遠くの夜景、氷川丸、穏やかな海"
    },
    "stage5": {
        "label": "横浜駅",
        "prompt": "横浜駅周辺風の風景、繁華街、たくさんの商業ビル、夕暮れの空、活気のある都市"
    },
    "stage6": {
        "label": "桜木町",
        "prompt": "横浜桜木町風の風景、大観覧車、ロープウェイ（エアキャビン）、コスモワールド、夜の光"
    },
}

TIER4_BASE_PROMPT = (
    "子供向けスマホRPGのバトル背景、横長16:9、"
    "明るく色彩豊かなアニメ調のイラスト、"
    "{scene}、"
    "画面下部は空白（キャラクターが立てるスペース）、"
    "高品質、ゲームバトル画面に適したデザイン"
)


def generate_tier4(client, sdk_type: str) -> dict:
    """Tier4 バトル背景を生成・判定・保存する。"""
    _print("\n" + "=" * 60)
    _print("🏙️ Tier 4: バトル背景 生成開始")
    _print("=" * 60)

    summary = {"adopted": 0, "alternates": 0, "errors": 0}
    adoption_notes = {}

    for stage_id, stage_info in TIER4_STAGES.items():
        _print(f"\n📌 {stage_info['label']} ({stage_id}) 生成中...")
        prompt = TIER4_BASE_PROMPT.replace("{scene}", stage_info["prompt"])

        # 2案生成 (16:9 横長)
        images = generate_multi_images(client, sdk_type, prompt, 2, "16:9")

        placeholder_b = _load_placeholder_bytes()
        error_count = sum(1 for img in images if img == placeholder_b)
        if error_count > 0:
            log_error("tier4", f"{stage_id}: {error_count}/2 枚生成失敗")
            summary["errors"] += error_count

        # 判定
        context = f"{stage_info['label']}のバトル背景（子供向けRPG）"
        best_idx = judge_best(client, sdk_type, images, context)
        adoption_notes[stage_id] = f"採用{best_idx + 1}番 ({stage_info['label']})"

        # 採用保存
        save_image(images[best_idx], BGSDIR / f"{stage_id}.png")
        summary["adopted"] += 1

        # alternate 保存
        alt_idx = 1 - best_idx
        save_image(images[alt_idx], BGSDIR / "alternates" / f"{stage_id}_alt.png")
        summary["alternates"] += 1

    _print(f"\n✅ Tier4 完了: 採用 {summary['adopted']} 枚 / alternates {summary['alternates']} 枚 / エラー {summary['errors']} 枚")
    return {**summary, "notes": adoption_notes}


# ============================================================
# メイン
# ============================================================
def main():
    start_time = datetime.now()
    _print(f"🚀 Phase 2e 画像生成スクリプト 開始: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    _print(f"   作業ディレクトリ: {Path.cwd()}")

    # API キー確認
    if not GEMINI_API_KEY:
        _print("🚨 GEMINI_API_KEY が設定されていません。")
        _print("   .env ファイルに GEMINI_API_KEY=xxx を追記するか、環境変数として設定してください。")
        flush_log()
        sys.exit(1)

    _print(f"   GEMINI_API_KEY: 設定あり (先頭4文字: {GEMINI_API_KEY[:4]}****)")

    # Placeholder 生成
    create_placeholder()

    # Gemini クライアント初期化
    client, sdk_type = get_genai_client()
    if client is None:
        _print("🚨 google-genai も google-generativeai も import できませんでした。")
        _print("   pip install google-genai google-generativeai を実行してください。")
        flush_log()
        sys.exit(1)

    _print(f"   SDK: {sdk_type}")

    # ディレクトリ作成
    for d in [CHARS_DIR, CHARS_DIR / "alternates", SKINS_DIR, BGSDIR, BGSDIR / "alternates"]:
        d.mkdir(parents=True, exist_ok=True)

    total_errors = 0

    try:
        # Tier 1
        t1 = generate_tier1(client, sdk_type)
        total_errors += t1["errors"]

        # Tier 2
        t2 = generate_tier2(client, sdk_type)
        total_errors += t2["errors"]

        # Tier 4
        t4 = generate_tier4(client, sdk_type)
        total_errors += t4["errors"]

    except SystemExit:
        flush_log()
        raise
    except Exception as e:
        _print(f"🚨 予期しないエラーで中断: {traceback.format_exc()}")
        log_error("main", str(e))
        flush_log()
        sys.exit(1)

    end_time = datetime.now()
    elapsed = (end_time - start_time).total_seconds()

    _print("\n" + "=" * 60)
    _print("📊 完了サマリ")
    _print("=" * 60)
    _print(f"Tier 1 (キャラ立ち絵): 採用 {t1['adopted']} / alternates {t1['alternates']} / エラー {t1['errors']}")
    for k, v in t1.get("notes", {}).items():
        _print(f"  {k}: {v}")
    _print(f"Tier 2 (★4 スキン):    採用 {t2['adopted']} / エラー {t2['errors']}")
    _print(f"Tier 4 (バトル背景):   採用 {t4['adopted']} / alternates {t4['alternates']} / エラー {t4['errors']}")
    for k, v in t4.get("notes", {}).items():
        _print(f"  {k}: {v}")
    _print(f"\n総エラー数: {total_errors} / 42枚")
    _print(f"所要時間: {elapsed:.1f}秒")
    _print(f"終了: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    _print("=" * 60)

    flush_log()
    _print(f"📝 ログ保存: {LOG_FILE}")

    # エラー率チェック
    if total_errors / 42 >= 0.10:
        _print(f"⚠️ エラー率 {total_errors/42*100:.1f}% が 10% を超えています。generation_errors.log を確認してください。")


if __name__ == "__main__":
    main()
