export class Carousel {
    index = 0;
    maxIndex = 0;
    container;
    containerInner;

    controls = {
        left: null,
        right: null,
    };
    touching = false;
    constructor() {}
    init(container, controlLeft = null, controlRight = null) {
        this.container = container;
        this.controls.left = controlLeft;
        this.controls.right = controlRight;
        this.containerInner = container.children[0];
    }

    setTransform() {
        this.containerInner.style.transform = `translateX(${this.index * this.getItemWidth() * -1}px)`;
    }
    setTouchingTranslate(deltaX) {
        this.containerInner.style.transform = `translateX(${this.index * this.getItemWidth() * -1 + deltaX}px)`;
    }
    getItemWidth() {
        return this.containerInner.children[0].offsetWidth;
    }
    moveLeft() {
        // console.log(this);

        if (this.index <= 0) return;
        this.index--;
        this.setTransform();
    }
    moveRight() {
        if (this.index >= this.maxIndex) return;
        this.index++;
        this.setTransform();
    }
    addControlsEvent() {
        this.controls.left.addEventListener("click", () => {
            if (!this.touching) this.moveLeft();
        });
        this.controls.right.addEventListener("click", () => {
            if (!this.touching) this.moveRight();
        });
        this.addTouchingEvent();
    }
    addTouchingEvent() {
        let isHorizontal = false;
        let startX = 0;
        let startY = 0;
        let deltaX = 0;
        this.container.addEventListener(
            "touchstart",
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                this.containerInner.style.transition = "none";
            },
            {
                passive: true,
            },
        );
        this.container.addEventListener(
            "touchmove",
            (e) => {
                deltaX = e.touches[0].clientX - startX;
                if (!this.touching) {
                    let deltaY = e.touches[0].clientY - startY;
                    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
                        isHorizontal = true;
                    }
                    this.touching = true;
                }
                if (isHorizontal) {
                    e.preventDefault();
                    this.setTouchingTranslate(deltaX);
                }
            },
            {
                cancelable: false,
            },
        );
        this.container.addEventListener(
            "touchend",
            (e) => {
                this.touching = false;
                this.containerInner.style.transition = null;

                if (!isHorizontal) return;
                isHorizontal = false;
                this.containerInner.getBoundingClientRect();

                if (deltaX < -20) {
                    this.moveRight();
                } else if (deltaX > 20) {
                    this.moveLeft();
                } else {
                    this.setTransform();
                }
            },
            false,
        );
    }
}
