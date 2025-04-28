import os

from flask import Flask, request, render_template, send_from_directory, jsonify
import cv2
import subprocess
# import time


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
        return jsonify({"success": False, "error": "Файл не найден..."})

    file = request.files['uploadForm_File']
    if file.filename == '':
        return jsonify({"success": False, "error": "Файл не выбран..."})

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)
    return jsonify({"success": True, "filename": file.filename})


# маршрут обработки загруженного исходного видеофайла
@app.route('/process', methods=['POST'])
def process_video_route():
    try:
        data = request.get_json()  # Получаем JSON из тела запроса.  Важно!
        filename = data.get('filename')
        param1 = data.get('param1')
        param2 = data.get('param2')
        param3 = data.get('param3')
        param4 = data.get('param4')

        print(
            f"Received parameters: param1={param1}, param2={param2}, param3={param3}, param4={param4}, filename={filename}")

        input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        processed_filename = f"processed_{filename}"
        processed_path = os.path.join(app.config['PROCESSED_FOLDER'], processed_filename)

        # Обработка видео
        process_video(input_path, processed_path)

        # оптимизация (уменьшение размера) обработанного видео
        optimizes_output_video = os.path.join(app.config['PROCESSED_FOLDER'], f"optimized_processed_{filename}")
        # Команда FFmpeg для сжатия видео
        ffmpeg_command = [
            'ffmpeg', '-i', f"{processed_path}",
            '-c:v', 'libx264', '-crf', '23', '-preset', 'medium',
            '-c:a', 'aac', f"{optimizes_output_video}"
        ]
        # Запуск команды (на компьютере-сервере должна быть установлена программа ffmpeg)
        subprocess.run(ffmpeg_command)
        optimizes_processed_filename = os.path.basename(optimizes_output_video)
        # удаляем неоптимизированный обработанный файл
        os.remove(processed_path)
        return jsonify({"success": True, "filename": optimizes_processed_filename})

    except Exception as e:
        # Обрабатываем любые исключения, которые могут произойти.
        print(f"Error during processing: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500  # 500 Internal Server Error


# маршрут вывода прогресса обработки загруженного исходного видеофайла
# вызывается из js-кода с визуализацией прогресс-бара процесса обработки видео
@app.route('/progress')
def get_progress():
    return jsonify(processing_status)


# этот маршрут вызывается из шаблона result.html тег video
@app.route('/processed/<filename>')
def processed_video(filename):
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename)


def process_video(input_path, output_path):
    # используем ранее объявленную глобальную переменную, в которую будут записываться текущие прогресс
    # обработки видео в процентах от общего количества кадров в исходном видео
    global processing_status

    # Чтение видео
    cap = cv2.VideoCapture(input_path)
    # берем кодек .H264, потому что с mp4v в браузере видео не идет (идет только в видеопроигрывателях,
    # где есть соответствующие кодеки), правда размер видео получается намного больше, поэтому приходится
    # оптимизировать
    # fourcc = cv2.VideoWriter_fourcc(*'H264')
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    frame_processed = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Пример обработки: преобразование в черно-белое
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray_frame = cv2.cvtColor(gray_frame, cv2.COLOR_GRAY2BGR)  # Преобразование обратно для сохранения формата
        out.write(gray_frame)

        frame_processed += 1
        processing_status["progress"] = int((frame_processed / frame_count) * 100)
        #time.sleep(0.05)  # Имитация задержки обработки

    cap.release()
    out.release()
    processing_status["progress"] = 100


@app.route('/movie', methods=['GET'])
def runProcess():
    filename = request.args.get('filename')
    if filename:
        return render_template('result.html', src=filename).encode(encoding='UTF-8')


if __name__ == '__main__':
    app.run(debug=True)
