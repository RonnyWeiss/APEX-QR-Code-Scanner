 # APEX-QR-Code-Scanner

![Screenshot](https://github.com/RonnyWeiss/APEX-QR-Code-Scanner/blob/master/screenshot.gif?raw=true)

This Region Plug-in is used to scan QR Codes. If any string has been detected an APEX Item can be set, Dynamic Action can be fired or JavaScript can be executed.

If you don't to know how to install this Plug-in in Apex, please take look at the Documentation of Oracle APEX.

To control the QR Code Scanner you can fire events on th QR Code region.

$("#qrscanner_region").trigger("scannerPause"); => Pause the scanner
$("#qrscanner_region").trigger("scannerPlay"); => Restart the scanner from pause
$("#qrscanner_region").trigger("resetValue"); => Reset value to rescan the same QR Code if needed

For working Demo just click on:

https://apex.oracle.com/pls/apex/f?p=103428

Login is: user-demo / 123456@

If you like my stuff, donate me a coffee

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/RonnyW1)