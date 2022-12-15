 # APEX-QR-Code-Scanner
 
 ![](https://img.shields.io/badge/ORACLE-APEX-success.svg) ![](https://img.shields.io/badge/Plug--in_Type-Region-orange.svg) ![](https://img.shields.io/badge/Avaiable%20for%20APEX-5.1.3%20or%20above-blue)

![Screenshot](https://github.com/RonnyWeiss/APEX-QR-Code-Scanner/blob/master/screenshot.gif?raw=true)

This Region Plug-in is used to scan codes. If any string has been detected an APEX Item can be set, Dynamic Action can be fired or JavaScript can be executed.
The following formats are supported: QR_CODE, AZTEC, CODABAR, CODE_39, CODE_93, CODE_128, DATA_MATRIX, MAXICODE, ITF, EAN_13, EAN_8, PDF_417, RSS_14, RSS_EXPANDED, UPC_A, UPC_E, UPC_EAN_EXTENSION

If you don't to know how to install this Plug-in in Apex, please take look at the Documentation of Oracle APEX.

To control the QR Code Scanner you can fire events on th QR Code region. The following events are supportet:

apex.region("region_id").pause(); => stop Scanner Video
apex.region("region_id").start(); => start Scanner video
apex.region("region_id").refresh(); => reset the currentValue and the item
apex.region("region_id").setFacingMode(); => change camera

For working Demo just click on:

https://apex.oracle.com/pls/apex/f?p=103428

If you like my stuff, would be nice if you donate me a coffee

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/RonnyW1)
