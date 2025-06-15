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
  if (
    e.target.classList.contains('text-layer') ||
    e.target.classList.contains('slide-default-text')
  ) {
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
  // Load saved text data (including default and added)
  const savedTextData = JSON.parse(localStorage.getItem('invitationTextData')) || [];

  savedTextData.forEach((data) => {
    const slide = document.querySelectorAll('.swiper-slide')[data.slideIndex];

    if (data.isDefaultText) {
      // Find existing default text element on this slide or create if missing
      let defaultText = slide.querySelector('.slide-default-text');
      if (!defaultText) {
        defaultText = createTextLayer(data, true);
        slide.appendChild(defaultText);
      } else {
        // Update default text content and styles
        defaultText.innerText = data.text || defaultText.innerText;
        defaultText.style.top = data.top || defaultText.style.top;
        defaultText.style.left = data.left || defaultText.style.left;
        defaultText.style.fontSize = data.fontSize || defaultText.style.fontSize;
        defaultText.style.color = data.color || defaultText.style.color;
        defaultText.style.fontFamily = data.fontFamily || defaultText.style.fontFamily;
        defaultText.style.transform = 'none'; // Ensure no transform for dragging
      }
      makeDraggable(defaultText);
      addLayerListeners(defaultText);
    } else {
      // Normal text-layer
      const newText = createTextLayer(data);
      slide.appendChild(newText);
    }
  });

  // For any default texts in DOM without saved data
  document.querySelectorAll('.slide-default-text').forEach((layer) => {
    makeDraggable(layer);
    addLayerListeners(layer);
    layer.style.transform = 'none'; // Make sure no transform
  });

  // For added or existing .text-layer
  document.querySelectorAll('.text-layer').forEach((layer) => {
    makeDraggable(layer);
    addLayerListeners(layer);
  });
});

function addLayerListeners(layer) {
  layer.addEventListener('click', (e) => {
    e.stopPropagation();
    selectTextLayer(layer);
  });
  layer.setAttribute('contenteditable', 'true');
}

function saveAllTextLayers() {
  const allTextData = [];
  document.querySelectorAll('.swiper-slide').forEach((slide, slideIndex) => {
    // Save .text-layer elements
    slide.querySelectorAll('.text-layer').forEach((layer) => {
      allTextData.push({
        text: layer.innerText,
        top: layer.style.top,
        left: layer.style.left,
        fontSize: layer.style.fontSize,
        fontFamily: layer.style.fontFamily,
        color: layer.style.color,
        slideIndex: slideIndex,
        isDefaultText: false,
      });
    });
    // Save .slide-default-text element if exists
    const defaultText = slide.querySelector('.slide-default-text');
    if (defaultText) {
      allTextData.push({
        text: defaultText.innerText,
        top: defaultText.style.top,
        left: defaultText.style.left,
        fontSize: defaultText.style.fontSize,
        fontFamily: defaultText.style.fontFamily,
        color: defaultText.style.color,
        slideIndex: slideIndex,
        isDefaultText: true,
      });
    }
  });
  localStorage.setItem('invitationTextData', JSON.stringify(allTextData));
}

function createTextLayer(data, isDefault = false) {
  const newText = document.createElement('div');
  newText.className = isDefault ? 'slide-default-text' : 'text-layer';
  newText.contentEditable = true;
  newText.innerText = data.text || (isDefault ? 'Default Text' : 'New Text');
  newText.style.position = 'absolute';

  // Use saved pixel position if present, else default positions (pixels, no % or transform)
  if (data.top && data.left) {
    newText.style.top = data.top;
    newText.style.left = data.left;
  } else {
    if (isDefault) {
      newText.style.top = '10px';
      newText.style.left = '10px';
    } else {
      newText.style.top = '50%';
      newText.style.left = '10%';
      newText.style.transform = 'none';
    }
  }

  newText.style.fontSize = data.fontSize || '24px';
  newText.style.color = data.color || '#8c3e08';
  newText.style.fontFamily = data.fontFamily || (isDefault ? 'Georgia, serif' : 'Arial');

  // Remove transform for default text so drag works properly
  if (isDefault) {
    newText.style.transform = 'none';
  } else {
    newText.style.transform = 'none';
  }

  makeDraggable(newText);
  addLayerListeners(newText);

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

editPanel.addEventListener('click', (e) => e.stopPropagation());
document.body.addEventListener('click', () => {
  editPanel.classList.add('hidden');
  selectedText = null;
});

function makeDraggable(el) {
  el.addEventListener('mousedown', function (e) {
    e.preventDefault();

    // Remove transform temporarily for drag calculations
    if (el.style.transform) {
      el.style.transformBackup = el.style.transform;
      el.style.transform = 'none';
    }

    const offsetX = e.clientX - el.getBoundingClientRect().left;
    const offsetY = e.clientY - el.getBoundingClientRect().top;

    function moveAt(e) {
      const parent = el.closest('.swiper-slide');
      const bounds = parent.getBoundingClientRect();
      let newLeft = e.clientX - bounds.left - offsetX;
      let newTop = e.clientY - bounds.top - offsetY;

      // Boundaries so text doesn't go outside slide
      newLeft = Math.max(0, Math.min(newLeft, bounds.width - el.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, bounds.height - el.offsetHeight));

      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    }

    function stopDrag() {
      document.removeEventListener('mousemove', moveAt);
      document.removeEventListener('mouseup', stopDrag);

      // Restore transform if it was there
      if (el.style.transformBackup) {
        el.style.transform = el.style.transformBackup;
        delete el.style.transformBackup;
      }
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
    result
      .map((num) => {
        const hex = parseInt(num).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
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
    // Don't allow deleting default text, just clear text content instead
    if (selectedText.classList.contains('slide-default-text')) {
      selectedText.innerText = '';
    } else {
      selectedText.parentElement.removeChild(selectedText);
    }
    selectedText = null;
    editPanel.classList.add('hidden');
    saveAllTextLayers();
  }
});
