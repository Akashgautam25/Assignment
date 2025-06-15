const swiper = new Swiper('.swiper-container', {
  direction: 'horizontal',
  loop: false,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  keyboard: {
    enabled: true,
    onlyInViewport: true,
  },
  touchStartPreventDefault: false,
});

let isDraggingText = false;
document.addEventListener('mousedown', (e) => {
  if (e.target.classList.contains('text-layer')) {
    isDraggingText = true;
    swiper.allowTouchMove = false;
  }
});
document.addEventListener('mouseup', () => {
  if (isDraggingText) {
    isDraggingText = false;
    swiper.allowTouchMove = true;
  }
});

let selectedText = null;
const editPanel = document.getElementById('edit-panel');
const fontSelect = document.getElementById('font-select');
const fontSizeInput = document.getElementById('font-size');
const fontColorInput = document.getElementById('font-color');
const textContentArea = document.getElementById('text-content');
const deleteBtn = document.getElementById('delete-text');

window.addEventListener('DOMContentLoaded', () => {
  const savedTextData = JSON.parse(localStorage.getItem('invitationTextData')) || [];
  savedTextData.forEach(data => {
    const slide = document.querySelectorAll('.swiper-slide')[data.slideIndex];
    const newText = createTextLayer(data);
    slide.appendChild(newText);
  });

  // Enable dragging and editing for existing text layers
  document.querySelectorAll('.text-layer, .slide-default-text').forEach(layer => {
    if (layer.classList.contains('text-layer')) {
      makeDraggable(layer);
    }

    layer.addEventListener('click', (e) => {
      e.stopPropagation();
      selectTextLayer(layer);
    });

    layer.setAttribute('contenteditable', 'true');
  });
});

function saveAllTextLayers() {
  const allTextData = [];
  document.querySelectorAll('.swiper-slide').forEach((slide, slideIndex) => {
    slide.querySelectorAll('.text-layer').forEach(layer => {
      allTextData.push({
        text: layer.innerText,
        top: layer.style.top,
        left: layer.style.left,
        fontSize: layer.style.fontSize,
        fontFamily: layer.style.fontFamily,
        color: layer.style.color,
        slideIndex: slideIndex
      });
    });
  });
  localStorage.setItem('invitationTextData', JSON.stringify(allTextData));
}

function createTextLayer(data) {
  const newText = document.createElement('div');
  newText.className = 'text-layer';
  newText.contentEditable = true;
  newText.innerText = data.text || 'New Text';
  newText.style.position = 'absolute';
  newText.style.top = data.top || '50%';
  newText.style.left = data.left || '10%';
  newText.style.fontSize = data.fontSize || '24px';
  newText.style.color = data.color || '#8c3e08';
  newText.style.fontFamily = data.fontFamily || 'Arial';

  makeDraggable(newText);

  newText.addEventListener('click', (e) => {
    e.stopPropagation();
    selectTextLayer(newText);
  });

  return newText;
}

function addText() {
  const activeIndex = swiper.activeIndex;
  const activeSlide = document.querySelectorAll('.swiper-slide')[activeIndex];
  const newText = createTextLayer({ slideIndex: activeIndex });
  activeSlide.appendChild(newText);
  selectTextLayer(newText);
  saveAllTextLayers();
}

function selectTextLayer(layer) {
  selectedText = layer;
  const style = window.getComputedStyle(layer);

  fontSelect.value = style.fontFamily.replaceAll('"', '').split(',')[0];
  fontSizeInput.value = parseInt(style.fontSize);
  fontColorInput.value = rgbToHex(style.color);
  textContentArea.value = selectedText.innerText;

  editPanel.classList.remove('hidden');
}

editPanel.addEventListener('click', e => e.stopPropagation());
document.body.addEventListener('click', () => {
  editPanel.classList.add('hidden');
  selectedText = null;
});

function makeDraggable(el) {
  el.addEventListener('mousedown', function (e) {
    e.preventDefault();
    const offsetX = e.clientX - el.getBoundingClientRect().left;
    const offsetY = e.clientY - el.getBoundingClientRect().top;

    function moveAt(e) {
      const parent = el.closest('.swiper-slide');
      const bounds = parent.getBoundingClientRect();
      let newLeft = e.clientX - bounds.left - offsetX;
      let newTop = e.clientY - bounds.top - offsetY;
      newLeft = Math.max(0, Math.min(newLeft, bounds.width - el.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, bounds.height - el.offsetHeight));
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    }

    function stopDrag() {
      document.removeEventListener('mousemove', moveAt);
      document.removeEventListener('mouseup', stopDrag);
      saveAllTextLayers();
    }

    document.addEventListener('mousemove', moveAt);
    document.addEventListener('mouseup', stopDrag);
  });
}

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result) return '#ffffff';
  return (
    '#' +
    result.map(num => {
      const hex = parseInt(num).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')
  );
}

// Input bindings
fontSelect.addEventListener('change', () => {
  if (selectedText) {
    selectedText.style.fontFamily = fontSelect.value;
    saveAllTextLayers();
  }
});

fontSizeInput.addEventListener('input', () => {
  if (selectedText) {
    selectedText.style.fontSize = fontSizeInput.value + 'px';
    saveAllTextLayers();
  }
});

fontColorInput.addEventListener('input', () => {
  if (selectedText) {
    selectedText.style.color = fontColorInput.value;
    saveAllTextLayers();
  }
});

textContentArea.addEventListener('input', () => {
  if (selectedText) {
    selectedText.innerText = textContentArea.value;
    saveAllTextLayers();
  }
});

deleteBtn.addEventListener('click', () => {
  if (selectedText && selectedText.parentElement) {
    selectedText.parentElement.removeChild(selectedText);
    selectedText = null;
    editPanel.classList.add('hidden');
    saveAllTextLayers();
  }
});
