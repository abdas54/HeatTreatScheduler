sap.ui.define(function() {
	"use strict";

	var Formatter = {

		date :  function (sDate) {
			if(sDate === null){
				return "";
			}
			else{
				var year = sDate.substring(0, 4);
				var month = sDate.substring(6, 8);
				var day = sDate.substring(4, 6);
				return day + "/" + month + "/" + year;
			}
		}
	};

	return Formatter;

})
