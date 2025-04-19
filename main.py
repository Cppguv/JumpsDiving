import os
from flask import Flask, request, render_template, send_from_directory, jsonify
import cv2
import subprocess
import time


app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

processing_status = {"progress": 0}  # Глобальная переменная для отслеживания прогресса обработки видео

# Создаем папки, если их нет
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)


# отрисовка стартовой страницы приложения (корневой маршрут)
@app.route('/', defaults={'path': ''}, methods=["POST", "GET"])
@app.route('/<path:path>')
def index(path):
    return render_template('index.html').encode(encoding='UTF-8')


# отрисовка страницы выбора файла исходного видео
@app.route('/startJob')
def startJob():
    return render_template('upload.html').encode(encoding='UTF-8')


# маршрут для загрузки исходного видеофайла на сервер
# вызывается из js-кода с визуализацией прогресс-бара загрузки видео
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'uploadForm_File' not in request.files:
        return f'''Файл не найден!'''

    file = request.files['uploadForm_File']
    if file.filename == '':
        return f'''Файл не выбран!'''

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)
    return f'''Файл успешно загружен! '''

# @app.route('/upload', methods=['POST'])
# def upload_file():
#     if 'file' not in request.files:
#         return jsonify({"success": False, "error": "Файл не найден"})
#
#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({"success": False, "error": "Файл не выбран"})
#
#     file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
#     file.save(file_path)
#
#     return jsonify({"success": True, "filename": file.filename})


# @app.route('/runProcess', methods=['POST'])
# def runProcess():
#     # Обработка видео
#     processed_file_path = os.path.join(app.config['PROCESSED_FOLDER'], f"processed_{file.filename}")
#     process_video(file_path, processed_file_path)
#
#     optimizes_output_video = os.path.join(app.config['PROCESSED_FOLDER'], f"optimized_processed_{file.filename}")
#     # Команда FFmpeg для сжатия видео
#     ffmpeg_command = [
#         'ffmpeg', '-i', f"{processed_file_path}",
#         '-c:v', 'libx264', '-crf', '23', '-preset', 'medium',
#         '-c:a', 'aac', f"{optimizes_output_video}"
#     ]
#     # Запуск команды
#     subprocess.run(ffmpeg_command)
#
#     return f'''
#     <!doctype html>
#     <title>Результат</title>
#     <h1>Обработанное видео</h1>
#     <video controls width="640">
#       <source src="/processed/{os.path.basename(optimizes_output_video)}" type="video/mp4">
#       Ваш браузер не поддерживает видео.
#     </video>
#     '''

@app.route('/processed/<filename>')
def processed_video(filename):
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename)

def process_video(input_path, output_path):
    # Чтение видео
    cap = cv2.VideoCapture(input_path)
    # fourcc = cv2.VideoWriter_fourcc(*'H264')
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Пример обработки: преобразование в черно-белое
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray_frame = cv2.cvtColor(gray_frame, cv2.COLOR_GRAY2BGR)  # Преобразование обратно для сохранения формата
        out.write(gray_frame)

    cap.release()
    out.release()

if __name__ == '__main__':
    app.run(debug=True)
