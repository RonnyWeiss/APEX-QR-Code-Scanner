var qrCodeScanner = (function () {
    "use strict";
    var scriptVersion = "1.0";
    var util = {
        version: "1.0.1",
        loader: {
            start: function (id) {

                try {
                    apex.util.showSpinner($(id));
                } catch (e) {
                    /* define loader */
                    var faLoader = $("<span></span>");
                    faLoader.attr("id", "loader" + id);
                    faLoader.addClass("ct-loader fa-stack fa-3x");

                    /* define circle for loader */
                    var faCircle = $("<i></i>");
                    faCircle.addClass("fa fa-circle fa-stack-2x");
                    faCircle.css("color", "rgba(121,121,121,0.6)");

                    /* define refresh icon with animation */
                    var faRefresh = $("<i></i>");
                    faRefresh.addClass("fa fa-refresh fa-spin fa-inverse fa-stack-1x");
                    faRefresh.css("animation-duration", "1.8s");

                    /* append loader */
                    faLoader.append(faCircle);
                    faLoader.append(faRefresh);
                    $(id).append(faLoader);
                }
            },
            stop: function (id) {
                $(id + " > .u-Processing").remove();
                $(id + " > .ct-loader").remove();
            }
        },
        jsonSaveExtend: function (srcConfig, targetConfig) {
            var finalConfig = {};
            /* try to parse config json when string or just set */
            if (typeof targetConfig === 'string') {
                try {
                    targetConfig = JSON.parse(targetConfig);
                } catch (e) {
                    console.error("Error while try to parse udConfigJSON. Please check your Config JSON. Standard Config will be used.");
                    console.error(e);
                    console.error(targetConfig);
                }
            } else {
                finalConfig = targetConfig;
            }
            /* try to merge with standard if any attribute is missing */
            try {
                finalConfig = $.extend(true, srcConfig, targetConfig);
            } catch (e) {
                console.error('Error while try to merge udConfigJSON into Standard JSON if any attribute is missing. Please check your Config JSON. Standard Config will be used.');
                console.error(e);
                finalConfig = srcConfig;
                console.error(finalConfig);
            }
            return finalConfig;
        }
    };

    return {
        /* Initialize function for cards */
        initialize: function (regionID, configJSON, setMode, executeCode, apexItem) {
            $("#" + regionID).css("min-height", "140px");
            util.loader.start("#" + regionID);
            var defConf = {
                height: 360,
                scanFrameColor: "rgba(192,0,15,1)",
                facingMode: "environment"
            };
            var bStr = "";

            var config = util.jsonSaveExtend(defConf, configJSON);

            /************************************************************************
             **
             ** Used to dom objects
             **
             ***********************************************************************/
            try {
                var video = document.createElement("video");
                var canvasElement = document.createElement("canvas");
                canvasElement.style.display = "block";
                canvasElement.style.margin = "5px auto";
                var canvas = canvasElement.getContext("2d");

                $("#" + regionID).append(canvasElement);
            } catch (e) {
                console.error("Error while try to create canvas for video frame");
                console.error(e);
            }

            /************************************************************************
             **
             ** Used to frame border around qr code
             **
             ***********************************************************************/
            function drawLine(begin, end, color) {
                canvas.beginPath();
                canvas.moveTo(begin.x, begin.y);
                canvas.lineTo(end.x, end.y);
                canvas.lineWidth = 4;
                canvas.strokeStyle = color;
                canvas.stroke();
            }
            /************************************************************************
             **
             ** Used to load video frame
             **
             ***********************************************************************/
            try {
                navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: config.facingMode
                    }
                }).then(function (stream) {
                    video.srcObject = stream;
                    video.setAttribute("playsinline", true); // required for iOS to prevent fullscreen
                    video.play();
                    requestAnimationFrame(tick);
                });
            } catch (e) {
                console.error("Your browser does not support video");
                console.error(e);
            }

            /************************************************************************
             **
             ** Used to scan qr code
             **
             ***********************************************************************/
            function tick() {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    // check ratio of video
                    var ratio = (video.videoWidth / video.videoHeight);
                    // workaround for some browser like edge
                    if (isNaN(ratio)) {
                        ratio = (video.width / video.height)
                    }
                    // workaround if no ratio can be calculated
                    if (isNaN(ratio)) {
                        ratio = 4 / 3
                    }
                    util.loader.stop("#" + regionID);
                    canvasElement.height = config.height;
                    canvasElement.width = config.height * ratio;
                    canvas.drawImage(video, 0, 0, Math.floor(canvasElement.width), Math.floor(canvasElement.height));
                    var imageData = canvas.getImageData(0, 0, Math.floor(canvasElement.width), Math.floor(canvasElement.height));
                    var code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });
                    if (code) {
                        drawLine(code.location.topLeftCorner, code.location.topRightCorner, config.scanFrameColor);
                        drawLine(code.location.topRightCorner, code.location.bottomRightCorner, config.scanFrameColor);
                        drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, config.scanFrameColor);
                        drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, config.scanFrameColor);
                        if (bStr.length != code.data.length) {
                            switch (setMode) {
                                case "1":
                                    try {
                                        var func = new Function("scannedValue", executeCode);

                                        func(code.data);
                                    } catch (e) {
                                        console.error("Error while execute JavaScript Code!");
                                        console.error(e);
                                    }
                                    break;
                                case "2":
                                    try {
                                        var value = code.data;

                                        // conver to number when number in correct language string
                                        if (value && value.length > 0 && !isNaN(value)) {
                                            value = parseFloat(value);
                                            value = value.toLocaleString(apex.locale.getLanguage());
                                        }

                                        apex.item(apexItem).setValue(value);
                                    } catch (e) {
                                        console.error("Error while try to set APEX Item!");
                                        console.error(e);
                                    }
                                    break;
                                case "3":
                                    apex.event.trigger('#' + regionID, 'qr-code-scanned', code.data);
                                    break;
                                default:
                                    console.error("SetMode not found!");
                            }
                            bStr = code.data;
                        }
                    }
                }

                /************************************************************************
                 **
                 ** Used to init qr code scan
                 **
                 ***********************************************************************/
                try {
                    requestAnimationFrame(tick);
                } catch (e) {
                    console.error("Error while try to scan QR Code");
                    console.error(e);
                }
            }

        }
    }
})();
