export class Router {
    constructor(appElement) {
        this.app = appElement;
        this.routes = {};
        this.history = [];
    }

    register(name, renderFn) {
        this.routes[name] = renderFn;
    }

    async navigate(name, params = {}, direction = 'forward') {
        const viewContent = await this.routes[name](params);

        // Create new view element
        const newView = document.createElement('div');
        newView.className = 'view';
        newView.innerHTML = viewContent;

        // Determine animation class
        if (direction === 'forward') {
            newView.classList.add('slide-in-right');
        } else if (direction === 'back') {
            newView.classList.add('slide-in-left');
        } else {
            newView.classList.add('slide-active');
        }

        this.app.appendChild(newView);

        // Current view (to be removed)
        const currentView = this.app.lastElementChild.previousElementSibling;

        // Force reflow
        newView.offsetWidth;

        // Animate
        requestAnimationFrame(() => {
            newView.classList.remove('slide-in-right', 'slide-in-left');
            newView.classList.add('slide-active');

            if (currentView) {
                if (direction === 'forward') {
                    currentView.style.transform = 'translateX(-100%)';
                } else if (direction === 'back') {
                    currentView.style.transform = 'translateX(100%)';
                }
            }
        });

        // Cleanup after animation
        setTimeout(() => {
            if (currentView) {
                this.app.removeChild(currentView);
            }
            // Bind events for the new view here if needed, or return the element to the caller
        }, 350); // Match CSS transition speed

        this.history.push({ name, params });
    }

    back() {
        if (this.history.length > 1) {
            this.history.pop(); // Current
            const prev = this.history[this.history.length - 1];
            this.navigate(prev.name, prev.params, 'back');
        }
    }
}
