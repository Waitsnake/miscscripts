"use strict";
var PixelateHelper = {
    ready: function (fn) {
        if (document.readyState != "loading") {
            fn()
        } else {
            document.addEventListener("DOMContentLoaded", fn)
        }
    },
    pixelateImages: function (images, options) {
        if (images) {
            images
                .forEach(function (image) {
                    if (image.complete) {
                        if (PixelateHelper.checkURL(image.src)) 
                            image.src = image.src + "?" + (new Date).getTime()
                    }
                    image
                        .addEventListener("load", function (e) {
                            this.pixelate(options)
                        })
                })
        }
    },
    pixelateVideos: function (videos, options) {
        if (videos) {
            videos
                .forEach(function (video) {
                    video
                        .addEventListener("play", function (e) {
                            this.pixelate(options)
                        })
                })
        }
    },
    createLocation: function (string) {
        var url = document.createElement("a");
        url.href = string;
        return url
    },
    checkURL: function (url) {
        url = PixelateHelper.createLocation(url);
        switch (url.hostname) {
            case "yt3.ggpht.com":
                return false
        }
        return true
    },
    getCSS: function (element) {
        var url;
        if (element.dataset.thumb) {
            url = PixelateHelper.createLocation(element.dataset.thumb)
        } else if (element.src) {
            url = PixelateHelper.createLocation(element.src)
        }
        if (url && url.hostname) {
            switch (url.hostname) {
                case "yt3.ggpht.com":
                    return {verticalAlign: "middle"};
                case "s.ytimg.com":
                case "i.ytimg.com":
                    if (element.parentNode.classList.contains("yt-uix-simple-thumb-related")) 
                        return {top: "-12px", position: "relative"}
                    }
        }
        return {}
    }
};
(function (window, $) {
    window.HTMLImageElement.prototype.pixelate = function () {
        this._settings = {
            value: .25,
            reveal_on_hover: false,
            reveal_on_click: false
        };
        this._arguments = [];
        for (var argument in arguments) {
            if (arguments.hasOwnProperty(argument)) {
                if (typeof arguments[argument] !== "undefined") {
                    this
                        ._arguments
                        .push(arguments[argument])
                }
            }
        }
        if (typeof this._done == "undefined") {
            this._done = false
        }
        this.parseArguments = function () {
            for (var option in this._settings) {
                if (this._settings.hasOwnProperty(option)) {
                    if (this.dataset.hasOwnProperty(option)) {
                        switch (this.dataset[option]) {
                            case "true":
                            case "false":
                                this._settings[option] = this.dataset[option] === "true";
                                break;
                            default:
                                this._settings[option] = this.dataset[option]
                        }
                    }
                    if (typeof this._arguments !== "undefined" && this._arguments.length === 1 && this._arguments[0].hasOwnProperty(option)) {
                        switch (this._arguments[0][option]) {
                            case "true":
                            case "false":
                                this._settings[option] = this._arguments[0][option] === "true";
                                break;
                            default:
                                this._settings[option] = this._arguments[0][option]
                        }
                    }
                }
            }
        };
        this.prepare = function () {
            this.computedWidth = getComputedStyle(this).width;
            this.computedHeight = getComputedStyle(this).height;
            this.displayWidth = parseFloat(this.computedWidth.split("px")[0]);
            this.displayHeight = parseFloat(this.computedHeight.split("px")[0]);
            if (!this.displayWidth) {
                console.error("this.displayWidth = ", this.displayWidth)
            }
            this.canvasCrop = document.createElement("canvas");
            this.canvasCrop.width = this.displayWidth;
            this.canvasCrop.height = this.displayHeight;
            this.canvasCrop.style.display = "none";
            this.contextCrop = this
                .canvasCrop
                .getContext("2d");
            this.contextCrop.mozImageSmoothingEnabled = false;
            this.contextCrop.webkitImageSmoothingEnabled = false;
            this.contextCrop.imageSmoothingEnabled = false;
            this
                .parentNode
                .insertBefore(this.canvasCrop, this);
            this.canvas = document.createElement("canvas");
            this.canvas.width = this.displayWidth;
            this.canvas.height = this.displayHeight;
            this.canvas.style = this.style;
            this.canvas.style.height = "auto";
            var styles = PixelateHelper.getCSS(this);
            for (var style in styles) {
                if (styles.hasOwnProperty(style)) {
                    this.canvas.style[style] = styles[style]
                }
            }
            this.canvas.classList = this.classList;
            for (var option in this.dataset) {
                if (this.dataset.hasOwnProperty(option)) {
                    if (option === "reactid") 
                        continue;
                    this.canvas.dataset[option] = this.dataset[option]
                }
            }
            this.context = this
                .canvas
                .getContext("2d");
            this.context.mozImageSmoothingEnabled = false;
            this.context.webkitImageSmoothingEnabled = false;
            this.context.imageSmoothingEnabled = false;
            this.cropWidth = this.displayWidth * this._settings.value;
            this.cropHeight = this.displayHeight * this._settings.value;
            this.style.display = "none";
            this
                .parentNode
                .insertBefore(this.canvas, this)
        };
        this.showCroppedImage = function () {
            this
                .contextCrop
                .drawImage(this, 0, 0, this.cropWidth, this.cropHeight);
            this
                .context
                .clearRect(0, 0, this.displayWidth, this.displayHeight);
            this
                .context
                .drawImage(this.canvasCrop, 0, 0, this.cropWidth, this.cropHeight, 0, 0, this.displayWidth, this.displayHeight)
        };
        this.showFullImage = function () {
            this
                .context
                .clearRect(0, 0, this.displayWidth, this.displayHeight);
            this
                .context
                .drawImage(this, 0, 0, this.displayWidth, this.displayHeight)
        };
        this.showCroppedVideo = function () {
            if (this.fullRequestID) 
                cancelAnimationFrame(this.fullRequestID);
            this.cropRequestID = requestAnimationFrame(this.showCroppedVideo);
            this.showCroppedImage()
        }.bind(this);
        this.showFullVideo = function () {
            if (this.cropRequestID) 
                cancelAnimationFrame(this.cropRequestID);
            this.fullRequestID = requestAnimationFrame(this.showFullVideo);
            this.showFullImage()
        }.bind(this);
        this.listen = function () {
            this.releaved = false;
            if (this._settings.reveal_on_hover === true) {
                this
                    .canvas
                    .addEventListener("mouseenter", function () {
                        if (this.revealed) 
                            return;
                        this.showFull()
                    }.bind(this));
                this
                    .canvas
                    .addEventListener("mouseleave", function () {
                        if (this.revealed) 
                            return;
                        this.showCropped()
                    }.bind(this))
            }
            if (this._settings.reveal_on_click === true) {
                this
                    .canvas
                    .addEventListener("click", function () {
                        this.revealed = !this.revealed;
                        if (this.revealed) {
                            this.showFull()
                        } else {
                            this.showCropped()
                        }
                    }.bind(this))
            }
        };
        if (!this._done) {
            this._done = true;
            this.parseArguments();
            this.prepare();
            if (this instanceof HTMLVideoElement) {
                this.showCropped = this.showCroppedVideo;
                this.showFull = this.showFullVideo
            } else {
                this.showCropped = this.showCroppedImage;
                this.showFull = this.showFullImage
            }
            this.showCropped();
            this.listen()
        }
        return this
    };
    window.HTMLVideoElement.prototype.pixelate = window.HTMLImageElement.prototype.pixelate;
    if (typeof $ === "function") {
        $
            .fn
            .extend({
                pixelate: function () {
                    return this.each(function () {
                        window
                            .HTMLImageElement
                            .prototype
                            .pixelate
                            .apply(this, arguments)
                    })
                }
            })
    }
    PixelateHelper
        .ready(function () {
            PixelateHelper.pixelateImages(document.querySelectorAll("img[data-pixelate]"));
            PixelateHelper.pixelateVideos(document.querySelectorAll("video[data-pixelate]"))
        })
})(window, typeof jQuery === "undefined"
    ? null
    : jQuery);