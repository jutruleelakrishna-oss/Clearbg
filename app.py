import os
import tempfile

import gradio as gr
from PIL import Image
from rembg import remove, new_session

MODEL_NAME = "RMBG-2.0"
USE_RMBG2 = os.getenv("USE_RMBG2", "1") != "0"
_session = None


def get_session():
    global _session
    if _session is None and USE_RMBG2:
        try:
            _session = new_session(MODEL_NAME)
        except Exception:
            _session = None
    return _session


def remove_background(image):
    if image is None:
        return None

    image = image.convert("RGBA")
    session = get_session()
    result = remove(image, session=session) if session else remove(image)
    return result


def prepare_download(image):
    if image is None:
        return None
    image = image.convert("RGBA")
    path = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
    image.save(path, "PNG")
    return path


CUSTOM_CSS = """
body {
    background: #f7f8fc;
}
.gradio-container {
    max-width: 1180px !important;
    margin: auto !important;
}
.hero {
    text-align: center;
    padding: 35px 15px 20px;
}
.hero h1 {
    font-size: 42px;
    margin-bottom: 8px;
}
.hero p {
    font-size: 18px;
    opacity: .7;
}
.card {
    border-radius: 18px !important;
}
#remove {
    min-height: 52px;
    font-size: 17px;
    font-weight: 700;
}
footer {
    display: none !important;
}
@media (max-width: 700px) {
    .hero h1 { font-size: 32px; }
}
"""

with gr.Blocks(
    title="ClearBG — AI Background Remover",
    theme=gr.themes.Soft(),
    css=CUSTOM_CSS,
) as demo:

    gr.HTML("""
    <div class="hero">
        <h1>✨ ClearBG</h1>
        <p>Remove image backgrounds instantly with AI</p>
    </div>
    """)

    with gr.Row(equal_height=False):
        with gr.Column(elem_classes="card"):
            gr.Markdown("### 📤 Upload your image")
            input_image = gr.Image(
                type="pil",
                sources=["upload", "clipboard"],
                label="Drop an image here",
                height=420,
            )
            remove_button = gr.Button(
                "✨ Remove Background",
                variant="primary",
                elem_id="remove",
            )
            clear_button = gr.ClearButton(
                [input_image],
                value="Clear",
            )

        with gr.Column(elem_classes="card"):
            gr.Markdown("### 🪄 Your result")
            output_image = gr.Image(
                type="pil",
                format="png",
                image_mode="RGBA",
                label="Transparent PNG",
                height=420,
            )
            download_button = gr.Button("⬇️ Prepare PNG Download")
            download_file = gr.File(
                label="Download your image",
                visible=False,
            )

    status = gr.Markdown("")

    remove_button.click(
        remove_background,
        inputs=input_image,
        outputs=output_image,
        show_progress="full",
    ).then(
        lambda: "✅ Background removed successfully!",
        outputs=status,
    )

    download_button.click(
        prepare_download,
        inputs=output_image,
        outputs=download_file,
    ).then(
        lambda: gr.update(visible=True),
        outputs=download_file,
    )

    gr.Markdown("""
---
### 🚀 How to use
**1.** Upload a photo → **2.** Click **Remove Background** → **3.** Prepare and download your transparent PNG.

**Supported:** JPG, JPEG, PNG and common image formats.

*The first image may take a little longer while the AI model loads.*
""")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "7860"))
    demo.launch(server_name="0.0.0.0", server_port=port)
