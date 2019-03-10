var qrCodeScanner = (function () {
    "use strict";
    var scriptVersion = "1.4";
    var util = {
        version: "1.0.5",
        isAPEX: function () {
            if (typeof (apex) !== 'undefined') {
                return true;
            } else {
                return false;
            }
        },
        debug: {
            info: function (str) {
                if (util.isAPEX()) {
                    apex.debug.info(str);
                }
            },
            error: function (str) {
                if (util.isAPEX()) {
                    apex.debug.error(str);
                } else {
                    console.error(str);
                }
            }
        },
        loader: {
            start: function (id) {
                if (util.isAPEX()) {
                    apex.util.showSpinner($(id));
                } else {
                    /* define loader */
                    var faLoader = $("<span></span>");
                    faLoader.attr("id", "loader" + id);
                    faLoader.addClass("ct-loader");

                    /* define refresh icon with animation */
                    var faRefresh = $("<i></i>");
                    faRefresh.addClass("fa fa-refresh fa-2x fa-anim-spin");
                    faRefresh.css("background", "rgba(121,121,121,0.6)");
                    faRefresh.css("border-radius", "100%");
                    faRefresh.css("padding", "15px");
                    faRefresh.css("color", "white");

                    /* append loader */
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
                    util.debug.error("Error while try to parse targetConfig. Please check your Config JSON. Standard Config will be used.");
                    util.debug.error(e);
                    util.debug.error(targetConfig);
                }
            } else {
                finalConfig = targetConfig;
            }
            /* try to merge with standard if any attribute is missing */
            try {
                finalConfig = $.extend(true, srcConfig, targetConfig);
            } catch (e) {
                util.debug.error('Error while try to merge 2 JSONs into standard JSON if any attribute is missing. Please check your Config JSON. Standard Config will be used.');
                util.debug.error(e);
                finalConfig = srcConfig;
                util.debug.error(finalConfig);
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
                util.debug.error("Error while try to create canvas for video frame");
                util.debug.error(e);
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
                util.debug.error("Your browser does not support video");
                util.debug.error(e);
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
                                        util.debug.error("Error while execute JavaScript Code!");
                                        util.debug.error(e);
                                    }
                                    break;
                                case "2":
                                    try {
                                        var value = code.data;

                                        // conver to number when number in correct language string
                                        if (value && value.length > 0 && !isNaN(value)) {
                                            value = parseFloat(value);
                                            value = value.toLocaleString(apex.locale.getLanguage(), {
                                                useGrouping: false
                                            });
                                        }

                                        apex.item(apexItem).setValue(value);
                                    } catch (e) {
                                        util.debug.error("Error while try to set APEX Item!");
                                        util.debug.error(e);
                                    }
                                    break;
                                case "3":
                                    apex.event.trigger('#' + regionID, 'qr-code-scanned', code.data);
                                    break;
                                default:
                                    util.debug.error("SetMode not found!");
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
                    util.debug.error("Error while try to scan QR Code");
                    util.debug.error(e);
                }
            }

            /* Add control events */
            $("#" + regionID).on("scannerPause", function () {
                video.pause();
                if (setMode == 2) {
                    apex.item(apexItem).setValue("");
                }
            });
            $("#" + regionID).on("scannerPlay", function () {
                bStr = "";
                video.play();
            });
            $("#" + regionID).on("resetValue", function () {
                bStr = "";
                if (setMode == 2) {
                    apex.item(apexItem).setValue("");
                }
            });
        }
    }
})();
