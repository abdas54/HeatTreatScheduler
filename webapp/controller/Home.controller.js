sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/ui/core/routing/History",
  'sap/m/MessageBox',
  'sap/ui/model/Filter',
  'sap/m/Dialog',
  'sap/ui/layout/HorizontalLayout',
  'sap/ui/layout/VerticalLayout',
  'sap/m/Label',
  'sap/m/Text',
  'sap/m/Button',
  'sap/m/Input'
], function (Controller, JSONModel, MessageToast, History, MessageBox, Filter, Dialog, HorizontalLayout, VerticalLayout, Label, Text, Button, Input) {
  "use strict";
  var oDataModel, sWarehouseTemp, oDataAdd;
  var sHour, sMinute, sAMPM, oModel, bAdd, bRefresh = false;
  var aHigh = [], aQuench = [], aDraw = [], aBin = [], aLatestTime = [], aPlannedTrays = [],aQue=[];
  var aHighNew = [], aQuenchNew = [], aDrawNew = [],aQueNew=[]; var sWarehouse, sTitle;
  var sStartHigh, sStartQuench, sStartDraw,sQue;
  return Controller.extend("ey.meg.root.controller.Home", {
    _GetTime: function () {
      var oDate = new Date();
      var sText;
      sHour = oDate.getHours();
      sMinute = oDate.getMinutes();
      if (sMinute < 10) {
        sMinute = "0" + sMinute;
      }
      if (sHour > 12) {
        sAMPM = " PM";
        sHour = sHour - 12;
        sText = sHour + ":" + sMinute + sAMPM;
      }
      else if (sHour === 12) {
        sAMPM = " PM";
        sText = sHour + ":" + sMinute + sAMPM;
      }
      else if (sHour === 0) {
        sAMPM = " AM";
        sText = "12" + ":" + sMinute + sAMPM;
      }
      else {
        sAMPM = " AM";
        sText = sHour + ":" + sMinute + sAMPM;
      }
      var oText = this.getView().byId("IDtext");
      oText.setText("Latest Update: " + sText);
      var iMonth = oDate.getMonth();
      var sMonth;
      switch (iMonth) {
        case 0:
          sMonth = "January";
          break;
        case 1:
          sMonth = "February";
          break;
        case 2:
          sMonth = "March";
          break;
        case 3:
          sMonth = "April";
          break;
        case 4:
          sMonth = "May";
          break;
        case 5:
          sMonth = "June";
          break;
        case 6:
          sMonth = "July";
          break;
        case 7:
          sMonth = "August";
          break;
        case 8:
          sMonth = "September";
          break;
        case 9:
          sMonth = "October";
          break;
        case 10:
          sMonth = "November";
          break;
        case 11:
          sMonth = "December";
          break;
      }
    },
    _ConvertTime: function (oTime, oDate) {
      var milliseconds = parseInt((oTime % 1000) / 100)
        , seconds = parseInt((oTime / 1000) % 60)
        , minutes = parseInt((oTime / (1000 * 60)) % 60)
        , hours = parseInt((oTime / (1000 * 60 * 60)) % 24);
      hours = (hours < 10) ? "0" + hours : hours;
      minutes = (minutes < 10) ? "0" + minutes : minutes;
      seconds = (seconds < 10) ? "0" + seconds : seconds;
      return new Date(oDate.getUTCFullYear(), oDate.getUTCMonth(), oDate.getUTCDate(), hours, minutes);
    },
    _ConcatenateTrays: function (aAppointments) {
      var oStartHourLast, oStartMinuteLast, oEndHourLast, oEndMinuteLast; var sTrayLast = "";
      var oStartHour, oStartMinute, oEndHour, oEndMinute; var sFinalTray = "";
      var oAppointments = {}; var aAppointmentFinal = [];
      for (var iCon = 0; iCon <= aAppointments.length; iCon++) {
        if (iCon === aAppointments.length) {
          oAppointments.title = sFinalTray;
          aAppointmentFinal.push(oAppointments);
          oAppointments = {};
          break;
        }
        oStartHour = aAppointments[iCon].start.getHours();
        oStartMinute = aAppointments[iCon].start.getMinutes();
        oEndHour = aAppointments[iCon].end.getHours();
        oEndMinute = aAppointments[iCon].end.getMinutes();
        if (oStartHour === oStartHourLast && oStartMinute === oStartMinuteLast
          && oEndHour === oEndHourLast && oEndMinute === oEndMinuteLast) {
          if (oAppointments.color === "#808080") {
            sFinalTray = "";
          }
          else {
            sFinalTray = aAppointments[iCon].title + "," + sFinalTray;
          }
        }
        else if ((oStartHour !== oStartHourLast || oStartMinute !== oStartMinuteLast
          || oEndHour !== oEndHourLast || oEndMinute !== oEndMinuteLast) && iCon !== 0) {
          oAppointments.title = sFinalTray;
          aAppointmentFinal.push(oAppointments);
          oAppointments = {};
          sFinalTray = "";
        }
        if (sFinalTray === "") {
          sFinalTray = aAppointments[iCon].title;
        }
        oAppointments.title = aAppointments[iCon].title;
        oAppointments.color = aAppointments[iCon].color;
        oAppointments.tentative = aAppointments[iCon].tentative;
        oAppointments.start = aAppointments[iCon].start;
        oAppointments.end = aAppointments[iCon].end;
        oStartHourLast = aAppointments[iCon].start.getHours();
        oStartMinuteLast = aAppointments[iCon].start.getMinutes();
        oEndHourLast = aAppointments[iCon].end.getHours();
        oEndMinuteLast = aAppointments[iCon].end.getMinutes();
      }
      return aAppointmentFinal;
    },
    dynamicSort: function (property) {
      var sortOrder = 1;
      if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
      }
      return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
      }
    },
    dynamicSortMultiple: function () {
      var oThat = this;
      var props = arguments;
      return function (obj1, obj2) {
        var i = 0, result = 0, numberOfProperties = props.length;
        while (result === 0 && i < numberOfProperties) {
          result = oThat.dynamicSort(props[i])(obj1, obj2);
          i++;
        }
        return result;
      }
    },
    _CreateJSON: function () {
      if (oDataAdd !== undefined) {
        if (oDataAdd.length !== 0) {
          console.log(oDataModel);
          console.log(oDataAdd);
          for (var iAdd = 0; iAdd < oDataAdd.length; iAdd++) {
            var aBin = [];
            var oAdd = {};
            var oBin = {};
            oBin.results = aBin;
            oAdd.ColorCode = "B";
            oAdd.BININFO = oBin;
            oAdd.EndDate = oDataAdd[iAdd].EndDate;
            oAdd.EndTime = oDataAdd[iAdd].EndTime;
            oAdd.StartDate = oDataAdd[iAdd].StartDate;
            oAdd.StartTime = oDataAdd[iAdd].StartTime;
            oAdd.Lenum = oDataAdd[iAdd].Lenum;
            oAdd.Lgnum = oDataAdd[iAdd].Lgnum;
            oAdd.Lgpla = oDataAdd[iAdd].Lgpla;
            oAdd.Operation = oDataAdd[iAdd].Operation;
            oDataModel.push(oAdd);
            if (oDataAdd[iAdd].Lgpla === "HO24" || oDataAdd[iAdd].Lgpla === "HO25") {
              aBin = [];
              oAdd = {};
              oBin = {};
              oBin.results = aBin;
              oAdd.ColorCode = "F";
              oAdd.BININFO = oBin;
              oAdd.EndDate = oDataAdd[iAdd].EndDate;
              oAdd.EndTime = oDataAdd[iAdd].EndTime;
              oAdd.StartDate = oDataAdd[iAdd].StartDate;
              oAdd.StartTime = oDataAdd[iAdd].StartTime;
              oAdd.Lenum = "";
              oAdd.Lgnum = oDataAdd[iAdd].Lgnum;
              if (oDataAdd[iAdd].Operation === "DRAW") {
                oAdd.Operation = "HIGH";
              }
              else if (oDataAdd[iAdd].Operation === "HIGH") {
                oAdd.Operation = "DRAW";
              }
              oAdd.Lgpla = oDataAdd[iAdd].Lgpla;
              oDataModel.push(oAdd);
            }
          }
          oDataModel.sort(this.dynamicSortMultiple("Lgpla", "ColorCode"));
        }
      }
      oDataModel.sort(this.dynamicSortMultiple("Operation", "Lgpla"));
      var orderPriority = ["HIGH", "QUENCH", "DRAW"];
      oDataModel.sort(function (a, b) {
        if (a.Operation == b.Operation) return a.Operation - b.Operation;
        return orderPriority.indexOf(a.Operation) - orderPriority.indexOf(b.Operation)
      });
      aHigh = [], aQuench = [], aDraw = [], aQue =[];
      var sOperation, aAppointments = [], aAppointFinal = [];
      var sEquipLast = ""; var oJSON = {};
      for (var i = 0; i <= oDataModel.length; i++) {
        if (i === oDataModel.length) {
          if (aAppointments.length > 0) {
            oJSON.appointments = this._ConcatenateTrays(aAppointments);
          }
          if (sOperation === "HIGH") {
            aHigh.push(oJSON);
          }
          else if (sOperation === "QUENCH") {
            aQuench.push(oJSON);
          }
          else if (sOperation === "DRAW") {
            aDraw.push(oJSON);
          }
          else if(sOperation === "QUE"){
            aQue.push(oJSON);
          }
          aAppointFinal = [];
          aAppointments = [];
          oJSON = {};
          break;
        }
        if (sEquipLast !== oDataModel[i].Lgpla && i !== 0) {
          if (aAppointments.length > 0) {
            oJSON.appointments = this._ConcatenateTrays(aAppointments);
          }
          if (sOperation === "HIGH") {
            aHigh.push(oJSON);
          }
          else if (sOperation === "QUENCH") {
            aQuench.push(oJSON);
          }
          else if (sOperation === "DRAW") {
            aDraw.push(oJSON);
          }
          else if(sOperation === "QUE"){
            aQue.push(oJSON);
          }
          aAppointments = [];
          oJSON = {};
        }
        sOperation = oDataModel[i].Operation;
        oJSON.name = oDataModel[i].Lgpla;
        sEquipLast = oDataModel[i].Lgpla;
        if (oDataModel[i].StartTime.ms !== 0) {
          var oAppointments = {};
          oAppointments.title = oDataModel[i].Lenum;
          //>>> start of change++ :Nathan Wang Date:2019.8.12 CR:DESK998794 OTRS:9901453
          //Description:Correct the logic of quench schedule
          if (parseInt(oDataModel[i].MinutesRemain) <= 30 && parseInt(oDataModel[i].MinutesRemain) !== 0) {
            oAppointments.color = "#ff0000";
          }
          else if (parseInt(oDataModel[i].MinutesRemain) > 30) {
            oAppointments.color = "#008000";
          }
          else if (oDataModel[i].ColorCode === "F") {
            oAppointments.color = "#808080";
          }
          else if (oDataModel[i].ColorCode === "B") {
            oAppointments.color = "#0000ff";
          }
          else if (oDataModel[i].ColorCode === "Y") {
            oAppointments.color = "#ffff00";
          }
          /*
          if(parseInt(oDataModel[i].MinutesRemain) <= 30 && parseInt(oDataModel[i].MinutesRemain) !== 0){
            oAppointments.color = "#ff0000";
          }
          else if(parseInt(oDataModel[i].MinutesRemain) > 30){
            oAppointments.color = "#008000";
          }
          else if(oDataModel[i].ColorCode === "F"){
            oAppointments.color = "#808080";
          }
          else if(oDataModel[i].ColorCode === "B"){
            oAppointments.color = "#0000ff";
          }
          */
          //<<< end of change++ :Nathan Wang Date:2019.8.12 CR:DESK998794 OTRS:9901453
          oAppointments.start = this._ConvertTime(oDataModel[i].StartTime.ms, oDataModel[i].StartDate);
          oAppointments.end = this._ConvertTime(oDataModel[i].EndTime.ms, oDataModel[i].EndDate);
          oAppointments.tentative = false;
          aAppointments.push(oAppointments);
          if (oDataModel[i].BININFO.results.length > 0) {
            for (var iBin = 0; iBin < oDataModel[i].BININFO.results.length; iBin++) {
              oAppointments = {};
              oAppointments.title = oDataModel[i].BININFO.results[iBin].Lenum;
              switch (oDataModel[i].BININFO.results[iBin].ColorCode) {
                case 'G':
                  oAppointments.color = "#008000";
                  break;
                case 'R':
                  oAppointments.color = "#ff0000";
                  break;
                case 'F':
                  oAppointments.color = "#808080";
                  break;
                case 'B':
                  oAppointments.color = "#0000ff";
                  break;
              }
              oAppointments.start = this._ConvertTime(oDataModel[i].BININFO.results[iBin].StartTime.ms, oDataModel[i].BININFO.results[iBin].StartDate);
              oAppointments.end = this._ConvertTime(oDataModel[i].BININFO.results[iBin].EndTime.ms, oDataModel[i].BININFO.results[iBin].EndDate);
              oAppointments.tentative = false;
              aAppointments.push(oAppointments);
              //Start of add gray tiles for every blue tile in draw HO24 and HO25
              if (oAppointments.color === "#0000ff" && (oJSON.name === "HO24" || oJSON.name === "HO25") && sOperation === "DRAW") {
                var oGray = {};
                var aGray = [];
                oGray.title = "";
                oGray.color = "#808080";
                oGray.tentative = false;
                oGray.start = oAppointments.start;
                oGray.end = oAppointments.end;
                for (var G = 0; G < aHigh.length; G++) {
                  if (aHigh[G].name === oJSON.name) {
                    if (aHigh[G].appointments !== undefined) {
                      aHigh[G].appointments.push(oGray);
                    }
                    else {
                      var oGrayAppointments = {};
                      oGrayAppointments.name = aHigh[G].name;
                      aGray.push(oGray);
                      oGrayAppointments.appointments = aGray;
                      aHigh[G] = oGrayAppointments;
                    }
                    break;
                  }
                }
              }
              //End of add gray tiles for every blue tile in draw HO24 and HO25
            }
          }
        }
        else if (oDataModel[i].StartTime.ms === 0 && oDataModel[i].BININFO.results.length > 0) {
          for (var iBin = 0; iBin < oDataModel[i].BININFO.results.length; iBin++) {
            oAppointments = {};
            oAppointments.title = oDataModel[i].BININFO.results[iBin].Lenum;
            switch (oDataModel[i].BININFO.results[iBin].ColorCode) {
              case 'G':
                oAppointments.color = "#008000";
                break;
              case 'R':
                oAppointments.color = "#ff0000";
                break;
              case 'F':
                oAppointments.color = "#808080";
                break;
              case 'B':
                oAppointments.color = "#0000ff";
                break;
            }
            oAppointments.start = this._ConvertTime(oDataModel[i].BININFO.results[iBin].StartTime.ms, oDataModel[i].BININFO.results[iBin].StartDate);
            oAppointments.end = this._ConvertTime(oDataModel[i].BININFO.results[iBin].EndTime.ms, oDataModel[i].BININFO.results[iBin].EndDate);
            oAppointments.tentative = false;
            aAppointments.push(oAppointments);
            //Start of add gray tiles for every blue tile in draw HO24 and HO25
            if (oAppointments.color === "#0000ff" && (oJSON.name === "HO24" || oJSON.name === "HO25") && sOperation === "DRAW") {
              var oGray = {};
              var aGray = [];
              oGray.title = "";
              oGray.color = "#808080";
              oGray.tentative = false;
              oGray.start = oAppointments.start;
              oGray.end = oAppointments.end;
              for (var G = 0; G < aHigh.length; G++) {
                if (aHigh[G].name === oJSON.name) {
                  if (aHigh[G].appointments !== undefined) {
                    aHigh[G].appointments.push(oGray);
                  }
                  else {
                    var oGrayAppointments = {};
                    oGrayAppointments.name = aHigh[G].name;
                    aGray.push(oGray);
                    oGrayAppointments.appointments = aGray;
                    aHigh[G] = oGrayAppointments;
                  }
                  break;
                }
              }
            }
            //End of add gray tiles for every blue tile in draw HO24 and HO25
          }
        }
      }
      /*sStartHigh = this._GetStartTime(aHigh);
      sStartQuench = this._GetStartTime(aQuench);
      sStartDraw = this._GetStartTime(aDraw);*/
    },
    _GetStartTime: function (aModel) {
      var sSDYear, sSDMonth, sSDDay, sSDHour, sSDMinute;
      for (var iSD = 0; iSD < aModel.length; iSD++) {
        if (aModel[iSD].appointments !== undefined) {
          for (var iApp = 0; iApp < aModel[iSD].appointments.length; iApp++) {
            if (sSDYear === undefined) {
              sSDYear = aModel[iSD].appointments[iApp].start.getFullYear();
              sSDMonth = aModel[iSD].appointments[iApp].start.getMonth();
              sSDDay = aModel[iSD].appointments[iApp].start.getDate();
              sSDHour = aModel[iSD].appointments[iApp].start.getHours();
              sSDMinute = aModel[iSD].appointments[iApp].start.getMinutes();
            }
            else {
              if (sSDYear > aModel[iSD].appointments[iApp].start.getFullYear()) {
                sSDYear = aModel[iSD].appointments[iApp].start.getFullYear();
                sSDMonth = aModel[iSD].appointments[iApp].start.getMonth();
                sSDDay = aModel[iSD].appointments[iApp].start.getDate();
                sSDHour = aModel[iSD].appointments[iApp].start.getHours();
                sSDMinute = aModel[iSD].appointments[iApp].start.getMinutes();
              }
              else if (sSDYear === aModel[iSD].appointments[iApp].start.getFullYear()) {
                if (sSDMonth > aModel[iSD].appointments[iApp].start.getMonth()) {
                  sSDMonth = aModel[iSD].appointments[iApp].start.getMonth();
                  sSDDay = aModel[iSD].appointments[iApp].start.getDate();
                  sSDHour = aModel[iSD].appointments[iApp].start.getHours();
                  sSDMinute = aModel[iSD].appointments[iApp].start.getMinutes();
                }
                else if (sSDMonth === aModel[iSD].appointments[iApp].start.getMonth()) {
                  if (sSDDay > aModel[iSD].appointments[iApp].start.getDate()) {
                    sSDDay = aModel[iSD].appointments[iApp].start.getDate();
                    sSDHour = aModel[iSD].appointments[iApp].start.getHours();
                    sSDMinute = aModel[iSD].appointments[iApp].start.getMinutes();
                  }
                  else if (sSDDay === aModel[iSD].appointments[iApp].start.getDate()) {
                    if (sSDHour > aModel[iSD].appointments[iApp].start.getHours()) {
                      sSDHour = aModel[iSD].appointments[iApp].start.getHours();
                      sSDMinute = aModel[iSD].appointments[iApp].start.getMinutes();
                    }
                    else if (sSDHour === aModel[iSD].appointments[iApp].start.getHours()) {
                      if (sSDMinute > aModel[iSD].appointments[iApp].start.getMinutes()) {
                        sSDMinute = aModel[iSD].appointments[iApp].start.getMinutes();
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return new Date(sSDYear, sSDMonth, sSDDay, sSDHour, sSDMinute);
    },
    onBeforeRendering: function () {
      var oThat = this;
      this.oMoveTrayModel = this.getOwnerComponent().getModel("moveTrayDataService");
      this.oVisibilityModel = this.getOwnerComponent().getModel("visibilityModel")
      this.getView().setModel(this.oVisibilityModel,"visibilityModel");
      try {
        sWarehouse = sap.ui.getCore().getModel("JSONModel").getProperty("/SelectionValue").Warehouse;
      }
      catch (err) {
      }
      if (sWarehouse !== undefined && sWarehouseTemp === undefined) {
        sWarehouseTemp = sWarehouse;
      }
      else if (sWarehouse === undefined) {
        sWarehouse = sWarehouseTemp;
      }
      oThat.warehouseNumber = sWarehouse;
      var sPath = "/BINDATASet?$filter=Lgnum eq '" + sWarehouse + "'&$expand=BININFO";
      var sURL = "/sap/opu/odata/SAP/ZUSPPMEG11E_HEAT_TREAT_SCH_SRV/";
      var oModel1 = new sap.ui.model.odata.v2.ODataModel(sURL, true);
      this.getView().setModel(oModel);
      var oFilter = new Filter("Lgnum", sap.ui.model.FilterOperator.EQ, sWarehouse);
      oModel1.read("/BINDATASet", {
        filters: [oFilter],
        urlParameters: {
          "$expand": "BININFO"
        },
        success: function (oData, oResponse) {
          console.log(oData);
          oDataModel = oData.results;
          oThat._CreateJSON();
          oModel = new JSONModel();
          oModel.setData({
            /*startDate1: sStartHigh,
            startDate2: sStartQuench,
            startDate3: sStartDraw,*/
            people1: aHigh,
            people2: aQuench,
            people3: aDraw,
            people4: aQue,
            legendItems: [
              {
                text: "Close to Being Done",
                color: "#ff0000"
              },
              {
                text: "Heat treat operation in Progress",
                color: "#008000"
              },
              {
                text: "Reserved for another phase",
                color: "#808080"
              },
              {
                text: "Tentatively Scheduled",
                color: "#0000ff"
              }
            ]
          });
          oThat.getView().setModel(oModel);
          var oStateModel = new JSONModel();
          oStateModel.setData({
            legendShown: false
          });
          oThat.getView().setModel(oStateModel, "stateModel");
          oThat._GetTime();
          oThat.changeStandardItemsPerView();
          sap.ui.core.BusyIndicator.hide();
        },
        error: function (oError) {
          var StringoError = JSON.parse(oError.responseText);
          var sErrorMessage = "";
          for (var iError = 0; iError < StringoError.error.innererror.errordetails.length - 1; iError++) {
            if (sErrorMessage === "") {
              sErrorMessage = StringoError.error.innererror.errordetails[iError].message;
            }
            else {
              sErrorMessage = sErrorMessage + "\n" + StringoError.error.innererror.errordetails[iError].message;
            }
          }
          sap.ui.core.BusyIndicator.hide();
          MessageBox.warning(
            sErrorMessage,
            {
              icon: MessageBox.Icon.WARNING,
              title: "",
              actions: [sap.m.MessageBox.Action.OK],
              initialFocus: MessageBox.Action.OK,
              onClose: function (sAction) {
                if (sAction === "OK") {
                  oThat.onBack();
                }
              }
            }
          );
        }
      });
    },
    handleViewChange: function () {
      this.changeStandardItemsPerView();
    },
    changeStandardItemsPerView: function () {
      var sViewKey = this.byId('PC1').getViewKey(),
        oLegend = this.byId("PlanningCalendarLegend");
      if (sViewKey !== sap.m.PlanningCalendarBuiltInView.OneMonth) {
        oLegend.setStandardItems([
        ]);
      } else {
        oLegend.setStandardItems();
      }
    },
    onRowSelection: function (oEvent) {
      var iIndex = oEvent.getParameters().rows.length;
      for (var i = 0; i < oEvent.getParameters().rows.length; i++) {
        if (oEvent.getParameters().rows[i].getProperty("selected") === true) {
          sTitle = oEvent.getParameters().rows[i].getTitle();
          break;
        }
      }
    },
    onScheduleNewTray: function () {
      var oThat = this;
      var aFilters = [];
      var sURL = "/sap/opu/odata/SAP/ZUSPPMEG11E_HEAT_TREAT_SCH_SRV/";
      var oModel1 = new sap.ui.model.odata.v2.ODataModel(sURL, true);
      this.getView().setModel(oModel);
      var oFilterWarehouse = new Filter("Lgnum", sap.ui.model.FilterOperator.EQ, sWarehouse);
      var oFilterBin = new Filter("Lgpla", sap.ui.model.FilterOperator.EQ, sTitle);
      aFilters.push(oFilterWarehouse);
      aFilters.push(oFilterBin);
      oModel1.read("/HTSTraySelectionSet", {
        filters: aFilters,
        success: function (oData, oResponse) {
          oDataAdd = oData.results;
          if (oDataAdd.length === 0) {
            MessageToast.show("No Trays can be scheduled right now", null, 1000);
          }
          else {
            MessageBox.confirm(
              "Schedule New Trays for Bin " + sTitle + "?",
              {
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                  if (sAction === "OK") {
                    //sTitle = "";
                    oThat.getView().rerender();
                    MessageToast.show("Tray " + oDataAdd[0].Lenum + " have been scheduled on Bins "
                      + oDataAdd[0].Lgpla + "," + oDataAdd[1].Lgpla + "," + oDataAdd[2].Lgpla, null, 1000);
                  }
                  else {
                    //sTitle = "";
                    MessageToast.show("Schedule New Trays cancelled", null, 1000);
                    oDataAdd = [];
                  }
                }
              }
            );
          }
        },
        error: function (oError) {
          var StringoError = JSON.parse(oError.responseText);
          var sErrorMessage = "";
          for (var iError = 0; iError < StringoError.error.innererror.errordetails.length - 1; iError++) {
            if (sErrorMessage === "") {
              sErrorMessage = StringoError.error.innererror.errordetails[iError].message;
            }
            else {
              sErrorMessage = sErrorMessage + "\n" + StringoError.error.innererror.errordetails[iError].message;
            }
          }
          MessageToast.show(sErrorMessage, null, 1000);
        }
      });
    },
    onRefresh: function () {
      oDataAdd = [];
      this.getView().rerender();
    },
    onBack: function () {
      oDataAdd = [];
      this.getOwnerComponent().getRouter().navTo("page1", null, true);
    },
    //>>> start of change++ :Nathan Wang Date:2019.8.12 CR:DESK998794 OTRS:9901453
    //Description:Display tray datail
    onAppointmentSelect: function (oEvent) {
    
      var oAppointment = oEvent.getParameter("appointment"),
        oBindingContext,
        sURL = "/sap/opu/odata/SAP/ZUSPPMEG11E_HEAT_TREAT_SCH_SRV/",
        oModelDetail = new sap.ui.model.odata.v2.ODataModel(sURL, {
          defaultCountMode: "Inline",
          defaultBindingMode: "OneWay",
          defaultOperationMode: "Server"
        }),
        aFilters = [],
        aLenum = [];
      if (oAppointment && oAppointment.getTitle()) {
        if (!this._oDetailDialog) {
          this._oDetailDialog = sap.ui.xmlfragment("ey.meg.root.fragments.Detail", this);
          this._oDetailDialog.setModel(oModelDetail);
          this.getView().addDependent(this._oDetailDialog);
        }
        //Filter With Storage Number
        aLenum = oAppointment.getBindingContext().getProperty("title").split(",")
        for (var i = 0; i < aLenum.length; i++) {
          aFilters.push(new Filter("Lenum", sap.ui.model.FilterOperator.EQ, aLenum[i]));
        }
        var oTable = sap.ui.getCore().byId("leaveRequestTable");
        oTable._getSelectAllCheckbox().setVisible(false);
        this.unselectAllItem(oTable);
        this._oDetailDialog.getContent()[0].getBinding("items").filter(aFilters);
        //Open Dialog
        this._oDetailDialog.open();
      }
    },
    handleSelectItem: function(oEvent){
      var itemChecked = oEvent.getParameter("selected");
      var selectedTrayNumber = oEvent.getParameter("listItem").getAggregation("cells")[0].getProperty("text");
      var oTable = sap.ui.getCore().byId("leaveRequestTable");

      for(var count =0 ; count < oTable.getItems().length ; count++){
          var getItemTrayNum = oTable.getItems()[count].getCells()[0].getText();
        if(selectedTrayNumber === getItemTrayNum){
          oTable.getItems()[count].setSelected(itemChecked);
        }
      }
      this.unSelectPrvItem(selectedTrayNumber,oTable);

    },
    unSelectPrvItem: function(trayNumber,oTable){
      for(var count =0 ; count < oTable.getItems().length ; count++){
          var getItemTrayNum = oTable.getItems()[count].getCells()[0].getText();
        if(trayNumber !== getItemTrayNum){
          oTable.getItems()[count].setSelected(false);
        }
      }
    },
    unselectAllItem: function(oTable){
      for(var count =0 ; count < oTable.getItems().length ; count++){
        oTable.getItems()[count].setSelected(false);
    }
    },
    onCloseDetail: function (oEvent) {
      this._oDetailDialog.close();
    },
    onPressMoveTray: function (oEvent) {
      var that = this;
      var selectedItem = sap.ui.getCore().byId("leaveRequestTable").getSelectedItems();
      this.getDestinationBins();
      this._moveTrayDialog = null;
      if (selectedItem.length > 0) {
      var trayNumber = selectedItem[0].getAggregation("cells")[0].getText();
      this.fetchPreviousDetails(trayNumber);
      // this._moveTrayDialog = sap.ui.xmlfragment(
      //   "ey.meg.root.fragments.MoveTray",
      //   this);
      // this.getView().addDependent(this._moveTrayDialog);
      // this._moveTrayDialog.open();
      }
      else{
        sap.m.MessageBox.error("Select Tray to Move");
      }



    },
    onSelectTime: function(oEvent){

      var selectedTime = this.convertTimeStamp(oEvent.getParameter("value"));
      //this.getDestinationBins(selectedTime);

      // var selectedTime = this.convertTimeStamp(selectedTime)
    },
    onSelectStorageBin: function (oEvent) {
      var moveTrayData = this.getOwnerComponent().getModel("moveTrayDataService");
      var selectedStorageType = oEvent.getParameter("selectedItem").getProperty("additionalText");
      moveTrayData.setProperty("/Storagetype", selectedStorageType);
    },
    handleMoveTray: function (oEvent) {
      var that = this;
      var tableItems = sap.ui.getCore().byId("leaveRequestTable").getSelectedItems();
      var requestPayload = {
        "N_todetails": []
      };
      var moveTrayData = this.getOwnerComponent().getModel("moveTrayDataService").getData();
      var sURL = "/sap/opu/odata/SAP/ZUSPPMEG11E_HEAT_TREAT_SCH_SRV/";
      var oModel1 = new sap.ui.model.odata.v2.ODataModel(sURL, true);
      oModel1.setUseBatch(false);
      // oModel1.setDeferredGroups(["group1"]);
      // var mParameters = {
      //             groupId:"group1",
      //             success:function(odata, resp){
      //                console.log(resp); },
      //             error: function(odata, resp){
      //                console.log(resp); }};

      if (tableItems.length > 0) {
        for (var count = 0; count < tableItems.length; count++) {
          var itemData = tableItems[count].getBindingContext().getObject();
          var oDataObject = {
            "Traynumber": itemData.Lenum,
            "Material": itemData.Matnr,
            "Serialnumber": itemData.Charg,
            "Starthigh": this.convertTimeStamp(moveTrayData.Starthigh),
            "Finishhigh": this.convertTimeStamp(moveTrayData.Finishhigh),
            "Startlow": this.convertTimeStamp(moveTrayData.Startlow),
            "Finishlow": this.convertTimeStamp(moveTrayData.Finishlow),
            "Sac": this.convertTimeStamp(moveTrayData.Sac),
            "Fb": this.convertTimeStamp(moveTrayData.Fb),
            "Destinationbin": moveTrayData.Destinationbin,
            "Storagetype" : moveTrayData.Storagetype,
            "Opinitial" : moveTrayData.Opinitial,
            "Note" : moveTrayData.Note,
            "Tonumber" : "",
            "CreatedAt" : null,
            "Tonumber" : ""
          }

          requestPayload.N_todetails.push(oDataObject);
          // oModel1.create("/TodetailsSet",requestPayload,mParameters);
        }
        // oModel1.submitChanges(mParameters);
        oModel1.create("/TodetailsSet", requestPayload, {
          success: function (oRes) {
            var transferOrderNumber = oRes.N_todetails.results[0].Tonumber;
            that._moveTrayDialog.getEndButton().firePress();
            that.onCloseMoveTray();
            sap.m.MessageBox.success("Transfer Order has been done successfully with reference Number " + transferOrderNumber);
            sap.m.MessageToast.show("Tray has been successfully moved");
            console.log(oRes);
            that._moveTrayDialog.close();
            that.resetMoveTrayData();
            that.onBeforeRendering();

          },
          error: function (oError) {
            var errorMsg="";
            if(JSON.parse(oError.responseText)){
              errorMsg = JSON.parse(oError.responseText).error.message.value;
            }
            sap.m.MessageBox.error(errorMsg);
            console.log(oError);
          }
        });
      }
      else {
        sap.m.MessageBox.error("Select Tray to Move");
      }


    },
    setMoveTrayData: function(data){
      var moveTrayData = this.getOwnerComponent().getModel("moveTrayDataService").getData();
      moveTrayData.Starthigh = this.msToHMS(data.Starthigh);
      moveTrayData.Finishhigh = this.msToHMS(data.Finishhigh);
      moveTrayData.Fb = this.msToHMS(data.Fb);
      moveTrayData.Opinitial = data.Opinitial;
      moveTrayData.Startlow = this.msToHMS(data.Startlow);
      moveTrayData.Finishlow = this.msToHMS(data.Finishlow);
      moveTrayData.Sac = this.msToHMS(data.Sac);
      moveTrayData.Note = data.Note;
      moveTrayData.Destinationbin = data.Destinationbin;
      moveTrayData.Storagetype = data.Storagetype;
      
      // this._moveTrayDialog.open();
      // this.getView().setModel(this.getOwnerComponent().getModel("moveTrayDataService"),"moveTrayDataService");
    },
    resetMoveTrayData: function () {
      var moveTrayData = this.getOwnerComponent().getModel("moveTrayDataService").getData();

      moveTrayData.Starthigh = "";
      moveTrayData.Finishhigh = "";
      moveTrayData.Fb = "";
      moveTrayData.Opinitial = "";
      moveTrayData.Startlow = "";
      moveTrayData.Finishlow = "";
      moveTrayData.Sac = "";
      moveTrayData.Note = "";
      moveTrayData.Destinationbin = "";
      moveTrayData.Storagetype = "";
      //this.oVisibilityModel.setProperty("/destComboBox",false);



    },
    msToHMS: function(ms) {
      if(ms && ms.ms){
      var seconds = ms.ms / 1000;
      const hours = parseInt( seconds / 3600 ); 
      seconds = seconds % 3600; 
      const minutes = parseInt( seconds / 60 ); // 60 seconds in 1 minute
      seconds = seconds % 60;
      return  hours+":"+minutes+":"+seconds;
      }
      else{
        return "00:00:00";
      }
    },
    onCloseMoveTray: function (oEvent) {
      this.resetMoveTrayData();
      this._moveTrayDialog.close();
      //that._moveTrayDialog = null;
    },
    fetchPreviousDetails: function(trayNumber){
      var that = this;
      var sURL = "/sap/opu/odata/SAP/ZUSPPMEG11E_HEAT_TREAT_SCH_SRV/";
      var oModel1 = new sap.ui.model.odata.v2.ODataModel(sURL, true);
      var oFilter = [];
      oFilter.push(new Filter("Traynumber", sap.ui.model.FilterOperator.EQ, trayNumber));
      //oFilter.push(new Filter("StartTime", sap.ui.model.FilterOperator.EQ,  selectedtime));
      oModel1.read("/TodetailsSet", {
        filters: oFilter,
        success: function (oData, oResponse) {
          
          if(oData.results.length > 0){
              that.setMoveTrayData(oData.results[0]);
          }
          that._moveTrayDialog = sap.ui.xmlfragment(
            "ey.meg.root.fragments.MoveTray",
            that);
          that.getView().addDependent(that._moveTrayDialog);
          that._moveTrayDialog.open();
          that.getView().setModel(that.getOwnerComponent().getModel("moveTrayDataService"),"moveTrayDataService");
          
          
        },
        error: function (oError) {
          that._moveTrayDialog = sap.ui.xmlfragment(
            "ey.meg.root.fragments.MoveTray",
            that);
          that.getView().addDependent(that._moveTrayDialog);
          that._moveTrayDialog.open();
          that.getView().setModel(that.getOwnerComponent().getModel("moveTrayDataService"),"moveTrayDataService");
        }
      });
    },
    getDestinationBins: function () {
      var that = this;
      var sURL = "/sap/opu/odata/SAP/ZUSPPMEG11E_HEAT_TREAT_SCH_SRV/";
      var oModel1 = new sap.ui.model.odata.v2.ODataModel(sURL, true);
      var oFilter = [];
      oFilter.push(new Filter("Lgnum", sap.ui.model.FilterOperator.EQ, that.warehouseNumber));
      //oFilter.push(new Filter("StartTime", sap.ui.model.FilterOperator.EQ,  selectedtime));
      oModel1.read("/StorageTypeSet", {
        filters: oFilter,
        success: function (oData, oResponse) {
          var jsonModel = new JSONModel;
          jsonModel.setData({ "DestinationSet": oData.results });
          that.getOwnerComponent().setModel(jsonModel, "DestinationBinModel");
          that.oVisibilityModel.setProperty("/destComboBox",true);
          // sap.ui.getCore().byId("destComboBox").setEnabled(true);
        },
        error: function (oError) {
          var errorMsg="";
          if(JSON.parse(oError.responseText)){
            errorMsg = JSON.parse(oError.responseText).error.message.value;
          }
          sap.m.MessageBox.error(errorMsg);
          console.log(oError);

        }
      });
    },
    convertTimeStamp: function (value) {
      var defaultValue = "";

      if ((value === undefined) || (value === null) || (value === "PTHundefinedMundefinedS") || (value === "")) {
        defaultValue = "PT00H00M00S";
      }
      else {
        var time = value.toString().split(":");
        defaultValue = "PT" + time[0] + "H" + time[1] + "M" + time[2] + "S";

      }
      return defaultValue;
    },
    setLocalTimeZoneZone : function (datevalue) {

      var dateTime = new Date(datevalue);
      if (datevalue === null) {
        return null;
      }
      else if (dateTime !== undefined && dateTime !== null && dateTime !== "") {
        var offSet = dateTime.getTimezoneOffset();
        var offSetVal = dateTime.getTimezoneOffset() / 60;
        var h = Math.floor(Math.abs(offSetVal));
        var m = Math.floor((Math.abs(offSetVal) * 60) % 60);
        dateTime = new Date(dateTime.setHours(h, m, 0, 0));
        return dateTime;
      }
      else {
        return null;
      }
    
    
    },
    //<<< end of change++ :Nathan Wang Date:2019.8.12 CR:DESK998794 OTRS:9901453
    //<<< Start Changed By Summer Li Date:2020.03.02 CR: DESK9A03WE OTRS:9901543

    onDiscrepancies: function () {
      var sURL = "/sap/opu/odata/SAP/ZUSPPMEG11E_HEAT_TREAT_SCH_SRV/";
      var oModel = new sap.ui.model.odata.v2.ODataModel(sURL, true);
      var aFilters = [];
      if (!this._oDifferenceDialog) {
        this._oDifferenceDialog = sap.ui.xmlfragment("ey.meg.root.fragments.Difference", this);
        this._oDifferenceDialog.setModel(oModel);
        this.getView().addDependent(this._oDifferenceDialog);
      }

      aFilters.push(new Filter("Lgnum", sap.ui.model.FilterOperator.EQ, sWarehouse));
      this._oDifferenceDialog.getContent()[0].getBinding("items").filter(aFilters);
      //Open Dialog
      this._oDifferenceDialog.open();
    },
    onCloseDifference: function (oEvent) {
      this._oDifferenceDialog.close();
    }
    //<<< End Changed By Summer Li Date:2020.03.02 CR: DESK9A03WE OTRS:9901543
  });
});