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
  //xhr.open('POST', 'upload_processing.py')
  xhr.open('POST', '/upload')

  xhr.send(formSent)
}

function updateProgress(loaded, total) {
  const loadedMb = (loaded/BYTES_IN_MB).toFixed(1)
  const totalSizeMb = (total/BYTES_IN_MB).toFixed(1)
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
    errorHandler()
  } else {
    statusText.textContent = event.target.responseText
    progressBar.value = 0
    fileInput.disabled = false
    submitButton.disabled = false
  }
}

function errorHandler() {
  resetProgress('Ошибка загрузки')
  fileInput.disabled = false
  submitButton.disabled = false
}
