import './flipbook.css';

export class Flipbook {
  constructor(options) {
    this.target = typeof options.target === 'string'
      ? document.querySelector(options.target)
      : options.target;

    if (!this.target) throw new Error('Target element not found');

    this.images = options.images || [];
    this.duration = options.duration || 800;
    this.bufferSize = options.bufferSize || 4;
    this.destroyed = false;

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundClickHandler = this.handleClick.bind(this);

    this.opts = options;
    this.singlePage = options.singlePage === true;
    this.useKeyboard = options.useKeyboard !== false;

    this.sheetCount = Math.ceil(this.images.length / 2);
    this.sheetElements = new Map(); // logicalIndex → {sheet, front, back}

    this.currentPage = 1;

    this.bookWidth = options.width || 800;
    this.bookHeight = options.height || 600;

    this.init();

    if (this.useKeyboard) {
        document.addEventListener('keydown', this.boundKeyDown);
    }

    if (!options.width && !options.height && this.images.length > 0) {
        this.detectRatio();
    }

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.target);
  }

  detectRatio() {
      const img = new Image();
      img.onload = () => {
          if (this.destroyed) return;

          const ratio = img.naturalWidth / img.naturalHeight;
          this.bookHeight = 1000;
          this.bookWidth = 2 * this.bookHeight * ratio;

          if (this.book) {
              this.book.style.width = `${this.bookWidth}px`;
              this.book.style.height = `${this.bookHeight}px`;
          }
          this.updateState();
          this.resize();
      };
      img.src = this.images[0];
  }

  handleKeyDown(e) {
      if (e.key === 'ArrowRight') {
          this.nextPage();
      } else if (e.key === 'ArrowLeft') {
          this.prevPage();
      }
  }

  handleClick(e) {
      const rect = this.target.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;

      if (clickX < width / 2) {
          this.prevPage();
      } else {
          this.nextPage();
      }
  }

  createSheet(logicalIndex) {
      if (this.sheetElements.has(logicalIndex)) return;

      const sheet = document.createElement('div');
      sheet.classList.add('flipbook-page');
      sheet.setAttribute('data-sheet-index', logicalIndex);

      const frontIndex = logicalIndex * 2;
      const backIndex = logicalIndex * 2 + 1;

      const front = document.createElement('div');
      front.classList.add('flipbook-page-front');
      if (this.images[frontIndex]) {
          front.style.backgroundImage = `url('${this.images[frontIndex]}')`;
      }

      const back = document.createElement('div');
      back.classList.add('flipbook-page-back');
      if (this.images[backIndex]) {
          back.style.backgroundImage = `url('${this.images[backIndex]}')`;
      }

      sheet.appendChild(front);
      sheet.appendChild(back);

      // Set initial flipped state BEFORE inserting into DOM (prevents CSS transition on creation)
      const sheetsToFlipCount = this.getSheetsToFlipCount();
      if (logicalIndex < sheetsToFlipCount) {
          sheet.classList.add('flipped');
      }

      // Insert in correct DOM order using data-sheet-index
      const existingSheets = this.book.querySelectorAll('.flipbook-page');
      let inserted = false;
      for (const existing of existingSheets) {
          const existingIndex = parseInt(existing.getAttribute('data-sheet-index'), 10);
          if (existingIndex > logicalIndex) {
              this.book.insertBefore(sheet, existing);
              inserted = true;
              break;
          }
      }
      if (!inserted) {
          this.book.appendChild(sheet);
      }

      this.sheetElements.set(logicalIndex, { sheet, front, back });
  }

  removeSheet(logicalIndex) {
      const entry = this.sheetElements.get(logicalIndex);
      if (!entry) return;
      entry.sheet.remove();
      this.sheetElements.delete(logicalIndex);
  }

  updateVirtualWindow() {
      // Compute sheet index from currentPage
      const currentSheetIndex = Math.floor((this.currentPage - 1) / 2);
      const rangeStart = Math.max(0, currentSheetIndex - this.bufferSize);
      const rangeEnd = Math.min(this.sheetCount - 1, currentSheetIndex + this.bufferSize);

      // Remove out-of-range sheets
      for (const idx of this.sheetElements.keys()) {
          if (idx < rangeStart || idx > rangeEnd) {
              this.removeSheet(idx);
          }
      }

      // Create missing in-range sheets
      for (let i = rangeStart; i <= rangeEnd; i++) {
          this.createSheet(i);
      }
  }

  getSheetsToFlipCount() {
      if (this.currentPage % 2 !== 0) {
          return Math.floor((this.currentPage - 1) / 2);
      } else {
          return Math.floor((this.currentPage - 1) / 2) + 1;
      }
  }

  init() {
    this.target.classList.add('flipbook-stage');

    this.book = document.createElement('div');
    this.book.classList.add('flipbook-book');
    this.book.style.width = `${this.bookWidth}px`;
    this.book.style.height = `${this.bookHeight}px`;
    this.book.style.setProperty('--page-duration', `${this.duration}ms`);

    this.target.appendChild(this.book);

    this.target.addEventListener('click', this.boundClickHandler);

    this.updateState();
    this.resize();
  }

  setSinglePageMode(enable) {
      if (this.singlePage === enable) return;
      this.singlePage = enable;
      this.updateState();
      this.resize();
  }

  resize() {
      const containerW = this.target.clientWidth;
      const containerH = this.target.clientHeight;

      if (!containerW || !containerH) return;

      const threshold = 1800;
      const shouldBeSingleForced = (containerW < threshold);

      if (this.opts.singlePage === 'auto') {
          if (shouldBeSingleForced !== this.singlePage) {
              this.singlePage = shouldBeSingleForced;
              this.target.classList.toggle('single-page', this.singlePage);
              this.target.classList.toggle('double-page', !this.singlePage);
              this.updateState();
          }
      } else {
          // Force single page if width < 1800, regardless of opts.singlePage unless it's strictly false? 
          // Usually "Force" means override.
          if (shouldBeSingleForced && !this.singlePage) {
              this.singlePage = true;
              this.target.classList.toggle('single-page', this.singlePage);
              this.target.classList.toggle('double-page', !this.singlePage);
              this.updateState();
          } else if (!shouldBeSingleForced && this.opts.singlePage !== 'auto' && this.singlePage !== this.opts.singlePage) {
              // Revert to original preference if above threshold
              this.singlePage = this.opts.singlePage === true;
              this.target.classList.toggle('single-page', this.singlePage);
              this.target.classList.toggle('double-page', !this.singlePage);
              this.updateState();
          } else {
              this.target.classList.toggle('single-page', this.singlePage);
              this.target.classList.toggle('double-page', !this.singlePage);
          }
      }

      let targetW, targetH;

      if (this.singlePage) {
          targetW = this.bookWidth / 2;
          targetH = this.bookHeight;
      } else {
          targetW = this.bookWidth;
          targetH = this.bookHeight;
      }

      const scaleX = containerW / targetW;
      const scaleY = containerH / targetH;

      let scale;
      if (this.singlePage) {
          scale = scaleX;
      } else {
          scale = Math.min(scaleX, scaleY) * 0.95;
      }

      this.currentScale = scale;
      this.updateTransform();
  }

  updateTransform() {
      const panX = this.currentPanX || 0;
      this.book.style.transform = `scale(${this.currentScale}) translateX(${panX}px)`;
  }

  nextPage() {
      if (this.singlePage) {
          if (this.currentPage < this.images.length) {
              this.currentPage++;
              this.updateState();
          }
      } else {
           if (this.currentPage === 1) {
               this.currentPage = 2;
           } else {
               if (this.currentPage + 2 <= this.images.length) {
                  this.currentPage += 2;
               } else if (this.currentPage < this.images.length && this.currentPage % 2 === 0) {
                   this.currentPage += 1;
               }
           }
           this.updateState();
      }
  }

  prevPage() {
      if (this.singlePage) {
          if (this.currentPage > 1) {
              this.currentPage--;
              this.updateState();
          }
      } else {
          if (this.currentPage > 2) {
              this.currentPage -= 2;
              if (this.currentPage < 1) this.currentPage = 1;
              this.updateState();
          } else if (this.currentPage === 2) {
              this.currentPage = 1;
              this.updateState();
          }
      }
  }

  goToPage(n) {
      this.currentPage = Math.max(1, Math.min(n, this.images.length));
      this.updateState();
  }

  updateState() {
      const sheetsToFlipCount = this.getSheetsToFlipCount();

      // Update virtual window (creates/removes sheets as needed)
      this.updateVirtualWindow();

      // Update flipped state on materialized sheets
      for (const [i, entry] of this.sheetElements) {
          if (i < sheetsToFlipCount) {
              entry.sheet.classList.add('flipped');
          } else {
              entry.sheet.classList.remove('flipped');
          }
      }

      this.updateZIndexes();

      // Calculate Pan
      if (this.singlePage) {
          if (this.currentPage % 2 === 0) {
              this.currentPanX = this.bookWidth / 4;
          } else {
              this.currentPanX = -this.bookWidth / 4;
          }
      } else {
          if (this.currentPage === 1) {
              this.currentPanX = -this.bookWidth / 4;
          } else if (this.currentPage === this.images.length && this.currentPage % 2 === 0) {
              this.currentPanX = this.bookWidth / 4;
          } else {
              this.currentPanX = 0;
          }
      }

      this.updateTransform();
  }

  updateZIndexes() {
      const total = this.sheetCount;
      for (const [i, entry] of this.sheetElements) {
          if (entry.sheet.classList.contains('flipped')) {
              entry.sheet.style.zIndex = i + 1;
          } else {
              entry.sheet.style.zIndex = total - i;
          }
      }
  }

  destroy() {
      if (this.destroyed) return;
      this.destroyed = true;

      if (this.resizeObserver) {
          this.resizeObserver.disconnect();
      }
      if (this.useKeyboard) {
          document.removeEventListener('keydown', this.boundKeyDown);
      }
      if (this.target) {
          this.target.removeEventListener('click', this.boundClickHandler);
      }
      if (this.target && this.book) {
          this.target.removeChild(this.book);
      }

      this.sheetElements.clear();
      this.sheetElements = null;
      this.images = null;
      this.book = null;
      this.target = null;
      this.boundKeyDown = null;
      this.boundClickHandler = null;
      this.resizeObserver = null;
  }
}
