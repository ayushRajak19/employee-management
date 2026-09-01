"""Local, no-per-minute-fee speech-to-text adapter for faster-whisper."""

import argparse
import json
import sys


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("audio")
    parser.add_argument("--model", default="small")
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--compute-type", default="int8")
    parser.add_argument("--language", default=None)
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(json.dumps({
            "error": "faster-whisper is not installed. Run: python -m pip install -r server/requirements-voice.txt"
        }))
        raise SystemExit(2)

    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    segments, info = model.transcribe(
        args.audio,
        language=args.language or None,
        beam_size=5,
        vad_filter=True,
        condition_on_previous_text=True,
    )
    text = " ".join(segment.text.strip() for segment in segments).strip()
    print(json.dumps({
        "text": text,
        "language": info.language,
        "languageProbability": info.language_probability,
        "durationSeconds": info.duration,
    }, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(1)
