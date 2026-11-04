const templateSelector = document.getElementById('template-selector');
const dynamicInputs = document.getElementById('dynamic-inputs');
const postCanvas = document.getElementById('post-canvas');
const btnExport = document.getElementById('btn-export');

// Настройки шаблонов
const templates = {
  guess: { 
    title: 'УГАДАЙ МАШИНЫ ПО ФАРЕ', 
    subtitle: 'И ПОЛУЧИ ПРИЗ!', 
    inputs: ['Заголовок', 'Подзаголовок'], 
    imagesCount: 3 
  },
  battle: { 
    title: 'БИТВА МАШИН', 
    subtitle: '', 
    inputs: ['Заголовок'], 
    imagesCount: 2 
  }
};

let uploadedImages = {};

// Отрисовка полей ввода
function renderInputs(templateKey) {
  const tpl = templates[templateKey];
  dynamicInputs.innerHTML = '';

  tpl.inputs.forEach((label, index) => {
    dynamicInputs.innerHTML += `
      <label>${label}
        <input type="text" class="text-input" data-index="${index}" value="${index === 0 ? tpl.title : tpl.subtitle}">
      </label>
    `;
  });

  for (let i = 0; i < tpl.imagesCount; i++) {
    dynamicInputs.innerHTML += `
      <label>Картинка ${i + 1}
        <input type="file" class="img-input" data-index="${i}" accept="image/*">
      </label>
    `;
  }

  document.querySelectorAll('.text-input').forEach(input => input.addEventListener('input', updatePreview));
  document.querySelectorAll('.img-input').forEach(input => input.addEventListener('change', handleImageUpload));
  
  updatePreview();
}

// Отрисовка превью
function updatePreview() {
  const type = templateSelector.value;
  const texts = Array.from(document.querySelectorAll('.text-input')).map(i => i.value);

  if (type === 'guess') {
    postCanvas.className = 'post-canvas tpl-guess';
    postCanvas.innerHTML = `
      <div class="post-title">${texts[0] || ''}</div>
      <div class="post-subtitle">${texts[1] || ''}</div>
      <div class="images-container">
        <div class="img-box"><img id="preview-img-0" src=""></div>
        <div class="img-box"><img id="preview-img-1" src=""></div>
        <div class="img-box"><img id="preview-img-2" src=""></div>
      </div>
    `;
  } else if (type === 'battle') {
    postCanvas.className = 'post-canvas tpl-battle';
    postCanvas.innerHTML = `
      <div class="post-title">${texts[0] || ''}</div>
      <div class="images-container">
        <div class="img-box"><img id="preview-img-0" src=""></div>
        <div class="img-box"><img id="preview-img-1" src=""></div>
      </div>
      <div class="vs-text">VS</div>
    `;
  }
  restoreImages();
}

// Обработка фото
function handleImageUpload(e) {
  const index = e.target.dataset.index;
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    uploadedImages[index] = event.target.result;
    restoreImages();
  };
  reader.readAsDataURL(file);
}

function restoreImages() {
  Object.keys(uploadedImages).forEach(index => {
    const imgElement = document.getElementById(`preview-img-${index}`);
    if (imgElement) imgElement.src = uploadedImages[index];
  });
}

// Смена шаблона
templateSelector.addEventListener('change', (e) => {
  uploadedImages = {}; 
  renderInputs(e.target.value);
});

// Скачивание PNG через html-to-image
btnExport.addEventListener('click', () => {
  btnExport.disabled = true;
  btnExport.innerText = 'Генерация...';

  // Временно убираем масштабирование и тени, чтобы экспорт был идеальным
  const originalTransform = postCanvas.style.transform;
  const originalBoxShadow = postCanvas.style.boxShadow;
  
  postCanvas.style.transform = 'scale(1)';
  postCanvas.style.boxShadow = 'none';
  postCanvas.style.position = 'absolute';
  postCanvas.style.left = '-9999px'; // Уводим за экран

  // Запускаем генерацию картинки
  htmlToImage.toPng(postCanvas, {
    quality: 1.0,
    pixelRatio: 1, // Если нужно 4K, поставь 2
    backgroundColor: null
  })
  .then((dataUrl) => {
    // Возвращаем всё как было
    postCanvas.style.transform = originalTransform;
    postCanvas.style.boxShadow = originalBoxShadow;
    postCanvas.style.position = 'relative';
    postCanvas.style.left = '0';

    // Скачиваем файл
    const link = document.createElement('a');
    link.download = `post-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  })
  .catch((error) => {
    console.error('Ошибка при генерации картинки:', error);
    alert('Не удалось создать картинку. Попробуй еще раз.');
  })
  .finally(() => {
    btnExport.disabled = false;
    btnExport.innerText = 'Скачать картинку';
  });
});

// Запуск при загрузке страницы
renderInputs('guess');