interface GridFxOptions {
    onInit?: () => void;
    onOpenItem?: (item: HTMLElement) => void;
    onCloseItem?: () => void;
}

export default class GridFx {
    private grid: HTMLElement;
    private items: HTMLElement[];
    private preview: HTMLElement | null;
    private options: GridFxOptions;
    private currentItem: HTMLElement | null = null;
    private isOpen = false;

    constructor(grid: HTMLElement, options: GridFxOptions = {}) {
        this.grid = grid;
        this.options = options;
        this.items = Array.from(grid.querySelectorAll('[data-size]'));
        this.preview = grid.parentElement?.querySelector('.preview') as HTMLElement;

        this.init();
    }

    private init(): void {
        this.bindEvents();
        this.options.onInit?.();
    }

    private bindEvents(): void {
        // Click handlers for grid items
        this.items.forEach(item => {
            const link = item.querySelector('a');
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openItem(item, link.href);
                });
            }
        });

        // Close button
        const closeBtn = this.preview?.querySelector('button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeItem());
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeItem();
            }
        });
    }

    private openItem(item: HTMLElement, imageSrc: string): void {
        if (this.isOpen) return;

        this.isOpen = true;
        this.currentItem = item;

        // Add current class to hide the clicked item
        item.classList.add('current');

        // Create and show the large image
        this.showPreview(imageSrc, item);

        // Callback
        this.options.onOpenItem?.(item);
    }

    private showPreview(imageSrc: string, item: HTMLElement): void {
        if (!this.preview) return;

        // Remove existing image
        const existingImg = this.preview.querySelector('img');
        if (existingImg) {
            existingImg.remove();
        }

        // Create new image
        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.opacity = '0';

        // Add description
        const description = item.querySelector('.description')?.textContent || '';
        const descEl = this.preview.querySelector('.previewDescription');
        if (descEl) {
            descEl.textContent = description;
        }

        // Show preview
        this.preview.classList.add('open');
        this.preview.appendChild(img);

        // Fade in image when loaded
        img.onload = () => {
            img.style.transition = 'opacity 0.3s ease';
            img.style.opacity = '1';
        };
    }

    private closeItem(): void {
        if (!this.isOpen || !this.currentItem || !this.preview) return;

        this.isOpen = false;

        // Hide preview
        this.preview.classList.remove('open');

        // Show the grid item again
        this.currentItem.classList.remove('current');

        // Clean up
        setTimeout(() => {
            const img = this.preview?.querySelector('img');
            if (img) {
                img.remove();
            }
        }, 300);

        this.currentItem = null;

        // Callback
        this.options.onCloseItem?.();
    }

    public destroy(): void {
        // Cleanup event listeners if needed
        this.items.forEach(item => {
            const link = item.querySelector('a');
            if (link) {
                link.removeEventListener('click', () => {});
            }
        });
    }
}
