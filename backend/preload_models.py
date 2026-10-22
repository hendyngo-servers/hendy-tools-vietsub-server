import os
from faster_whisper import WhisperModel
import argostranslate.package

def preload():
    print("=== Đang tải sẵn Whisper Model ('base')... ===")
    WhisperModel("base", device="cpu", compute_type="int8")
    print("Đã tải xong Whisper Model!")

    print("=== Đang tải sẵn gói ngôn ngữ Argos Translate (EN -> VI)... ===")
    argostranslate.package.update_package_index()
    available_packages = argostranslate.package.get_available_packages()
    
    package_to_install = next(
        filter(
            lambda x: x.from_code == "en" and x.to_code == "vi",
            available_packages
        ),
        None
    )

    if package_to_install:
        download_path = package_to_install.download()
        argostranslate.package.install_from_path(download_path)
        print("Đã cài đặt thành công gói EN -> VI!")
    else:
        print("Không tìm thấy gói ngôn ngữ phù hợp!")

if __name__ == "__main__":
    preload()
