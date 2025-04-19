const BYTES_IN_MB = 1048576

const form = document.getElementById('uploadForm')
const submitButton = form.querySelector('.form-upload__submit')
const fileInput = form.querySelector('.form-upload__input')
const sizeText = form.querySelector('#uploadForm_Size')
const statusText = form.querySelector('.form-upload__status')
const progressBar = form.querySelector('#progressBar')

function resetProgress(status = '') {
    statusText.textContent = status
    sizeText.textContent = ''
    progressBar.value = 0
}

function upload(fileToUpload) {
    const formSent = new FormData()
    formSent.append('uploadForm_File', fileToUpload)

    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', progressHandler, false)
    xhr.addEventListener('load', loadHandler, false)
    xhr.addEventListener('error', errorHandler);
    xhr.open('POST', '/upload')

    xhr.send(formSent)
}

function updateProgress(loaded, total) {
    const loadedMb = (loaded / BYTES_IN_MB).toFixed(1)
    const totalSizeMb = (total / BYTES_IN_MB).toFixed(1)
    const percentLoaded = Math.round((loaded / total) * 100)

    progressBar.value = percentLoaded
    sizeText.textContent = `${loadedMb} из ${totalSizeMb} МБ`
    statusText.textContent = `Загружено ${percentLoaded}% | `
}

addEventListener('load', function () {
    if (fileInput.value) {
        resetProgress()
    }
})

fileInput.addEventListener('change', function () {
    const file = this.files[0]
    if (file.size > 25 * BYTES_IN_MB) {
        alert('Принимается файл до 25 МБ')
        this.value = null
    }
    resetProgress()
})

form.addEventListener('submit', function (event) {
    event.preventDefault()
    if (fileInput.files.length > 0) {
        const fileToUpload = fileInput.files[0]
        fileInput.disabled = true
        submitButton.disabled = true
        resetProgress()
        upload(fileToUpload)
    } else {
        alert('Сначала выберите файл')
    }
    return false
})

function progressHandler(event) {
    updateProgress(event.loaded, event.total)
}

function loadHandler(event) {
    if (event.target.status !== 200) {
    //if (event.target.status !== 404) {
        errorHandler()
    } else {
        statusText.textContent = event.target.responseText
        processVideo();
    }
}

function errorHandler() {
    resetProgress('Ошибка загрузки')
    fileInput.disabled = false
    submitButton.disabled = false
}

function processVideo() {
    // создаем новую кнопку на странице для выбора опций обработки видео
    const buttonSelectOptions = document.createElement('button');
    buttonSelectOptions.textContent = 'Продолжить';
    buttonSelectOptions.classList.add('form-upload__submit', 'form-upload__submit_blue');
    buttonSelectOptions.style.margin = '25px auto';
    document.getElementsByClassName("uploader-wrapper")[0].appendChild(buttonSelectOptions);

    buttonSelectOptions.addEventListener('click', handleButtonClick);

    function handleButtonClick() {
        // Обработчик клика по кнопке

        // сбрасываем прогресс-бар на ноль и разблокируем кнопки (в принципе следующие три строчки необязательны)
        progressBar.value = 0
        fileInput.disabled = false
        submitButton.disabled = false

        // Сначала все стираем со страницы и заново рисуем новые элементы
        document.getElementById('uploadForm').innerHTML = '';
        this.remove();  // удаляем саму кнопку со страницы

        //myForm.className = 'form-container';
        // myForm.classList.add('form-container');
        // myForm.appendChild(label);

        // Создаем контейнер для формы
        const formContainer = document.createElement('div');
        formContainer.className = 'form-container';

        // Создаем элементы формы
        const label = document.createElement('label');
        label.textContent = 'Выберите опции:';

        const checkbox1 = document.createElement('input');
        checkbox1.type = 'checkbox';
        checkbox1.id = 'option1';
        checkbox1.value = 'option1';

        const label1 = document.createElement('label');
        label1.htmlFor = 'option1';
        label1.textContent = ' Конвертирование в черно-белое видео';

        const checkbox2 = document.createElement('input');
        checkbox2.type = 'checkbox';
        checkbox2.id = 'option2';
        checkbox2.value = 'option2';

        const label2 = document.createElement('label');
        label2.htmlFor = 'option2';
        label2.textContent = ' Применить нейросеть для распознания видео';

        // Контейнер для вложенных чекбоксов (изначально скрыт)
        const nestedContainer = document.createElement('div');
        nestedContainer.className = 'nested-checkboxes';
        nestedContainer.style.display = 'none';

        // Вложенные чекбоксы
        const nestedCheckbox1 = document.createElement('input');
        nestedCheckbox1.type = 'checkbox';
        nestedCheckbox1.id = 'nestedOption1';
        nestedCheckbox1.value = 'nestedOption1';

        const nestedLabel1 = document.createElement('label');
        nestedLabel1.htmlFor = 'nestedOption1';
        nestedLabel1.textContent = ' Визуализировать скелет на видео';

        const nestedCheckbox2 = document.createElement('input');
        nestedCheckbox2.type = 'checkbox';
        nestedCheckbox2.id = 'nestedOption2';
        nestedCheckbox2.value = 'nestedOption2';

        const nestedLabel2 = document.createElement('label');
        nestedLabel2.htmlFor = 'nestedOption2';
        nestedLabel2.textContent = ' Показ оценки на видео в каждый момент времени';

        // Кнопка подтверждения (изначально disable)
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Начать обработку';
        submitBtn.id = 'submitBtn';
        submitBtn.classList.add('form-upload__submit', 'form-upload__submit_green');
        submitBtn.style.margin = '25px auto';
        submitBtn.disabled = true;

        // Функция проверки состояния чекбоксов
        function updateSubmitButtonState() {
            const isMainOption1Checked = checkbox1.checked;
            const isMainOption2Checked = checkbox2.checked;
            const isNestedOption1Checked = nestedCheckbox1.checked;
            const isNestedOption2Checked = nestedCheckbox2.checked;

            // Активируем кнопку, если выбран хотя бы один основной чекбокс
            // или если выбран основной чекбокс 2 и хотя бы один вложенный
            const shouldEnable = isMainOption1Checked ||
                (isMainOption2Checked && (isNestedOption1Checked || isNestedOption2Checked)) ||
                isMainOption2Checked;

            submitBtn.disabled = !shouldEnable;
        }

        // Собираем форму
        nestedContainer.appendChild(nestedCheckbox1);
        nestedContainer.appendChild(nestedLabel1);
        nestedContainer.appendChild(document.createElement('br'));
        nestedContainer.appendChild(nestedCheckbox2);
        nestedContainer.appendChild(nestedLabel2);

        formContainer.appendChild(label);
        formContainer.appendChild(document.createElement('br'));
        formContainer.appendChild(document.createElement('br'));
        formContainer.appendChild(checkbox1);
        formContainer.appendChild(label1);
        formContainer.appendChild(document.createElement('br'));
        formContainer.appendChild(checkbox2);
        formContainer.appendChild(label2);
        formContainer.appendChild(nestedContainer);
        formContainer.appendChild(document.createElement('br'));
        formContainer.appendChild(submitBtn);

        // Добавляем форму на страницу
        document.getElementsByClassName("uploader-wrapper")[0].appendChild(formContainer);

        // Обработчики событий
        checkbox1.addEventListener('change', function () {
            handleMainCheckbox1Change(this.checked);
            updateSubmitButtonState();
        });

        checkbox2.addEventListener('change', function () {
            handleMainCheckbox2Change(this.checked);
            // Показываем/скрываем вложенные чекбоксы
            nestedContainer.style.display = this.checked ? 'block' : 'none';
            updateSubmitButtonState();
        });

        nestedCheckbox1.addEventListener('change', function () {
            handleNestedCheckbox1Change(this.checked);
            updateSubmitButtonState();
        });

        nestedCheckbox2.addEventListener('change', function () {
            handleNestedCheckbox2Change(this.checked);
            updateSubmitButtonState();
        });

        submitBtn.addEventListener('click', function () {
            handleSubmitButtonClick();
        });


        // Пустые функции-обработчики
        function handleMainCheckbox1Change(isChecked) {
            // Обработчик изменения основного checkbox 1
        }

        function handleMainCheckbox2Change(isChecked) {
            // Обработчик изменения основного checkbox 2
        }

        function handleNestedCheckbox1Change(isChecked) {
            // Обработчик изменения вложенного checkbox 1
        }

        function handleNestedCheckbox2Change(isChecked) {
            // Обработчик изменения вложенного checkbox 2
        }

        function handleSubmitButtonClick() {
            // Обработчик клика по кнопке подтверждения
            const formSent = new FormData()
            formSent.append('uploadForm_File', fileToUpload)

            const xhr = new XMLHttpRequest()
            xhr.upload.addEventListener('progress', progressHandler, false)
            xhr.addEventListener('load', loadHandler, false)
            xhr.addEventListener('error', errorHandler);
            xhr.open('POST', '/runProcess')

            xhr.send(formSent)
        }
    }
}