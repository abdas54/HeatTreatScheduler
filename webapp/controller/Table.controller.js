sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/routing/History",
	'sap/ui/model/Filter',
    'ey/meg/root/model/Formatter'
], function(Controller, JSONModel, MessageToast, DateFormat, History, Filter, Formatter) {
	"use strict";
	var oModel,sOperation;
	var oThis_View;
	var iSelectedSU, aSelectedSU = [], oSelectedSU = {};
	return Controller.extend("ey.meg.root.controller.Table", {
		formatter: Formatter,
		onInit: function(){
			iSelectedSU = 0;
			oThis_View = this.getView();
			oModel = new JSONModel();
			oModel.setData({
				bin : [
				  {name: "HIGH02", operation: "High"},
				  {name: "HIGH03", operation: "High"},
				  {name: "HIGH05", operation: "High"},
				  {name: "HIGH10", operation: "High"},
				  {name: "HIGH11", operation: "High"},
				  {name: "HIGH12", operation: "High"},
				  {name: "HIGH13", operation: "High"},
				  {name: "HIGH17", operation: "High"},
				  {name: "HO24", operation: "High"},
				  {name: "HO25", operation: "High"},
				  {name: "OIL01", operation: "Quench"},
				  {name: "WATER01", operation: "Quench"},
				  {name: "CBOX01", operation: "Quench"},
				  {name: "CBOX02", operation: "Quench"},
				  {name: "CBOX03", operation: "Quench"},
				  {name: "CBOX04", operation: "Quench"},
				  {name: "FAN01", operation: "Quench"},
				  {name: "FAN02", operation: "Quench"},
				  {name: "FAN03", operation: "Quench"},
				  {name: "FAN04", operation: "Quench"},
				  {name: "FAN05", operation: "Quench"},
				  {name: "FAN06", operation: "Quench"},
				  {name: "FAN07", operation: "Quench"},
				  {name: "FAN08", operation: "Quench"},
				  {name: "LOW06", operation: "Draw"},
				  {name: "LOW07", operation: "Draw"},
				  {name: "LOW08", operation: "Draw"},
				  {name: "LOW09", operation: "Draw"},
				  {name: "LOW18", operation: "Draw"},
				  {name: "LOW19", operation: "Draw"},
				  {name: "LOW20", operation: "Draw"},
				  {name: "LOW21", operation: "Draw"},
				  {name: "LOW22", operation: "Draw"},
				  {name: "LOW23", operation: "Draw"},
				  {name: "LOW26", operation: "Draw"},
				  {name: "HO24", operation: "Draw"},
				  {name: "HO25", operation: "Draw"}
				 ]
			});
		},
		
		onBeforeRendering: function(){
			aSelectedSU = [];
			var oModel2 = new sap.ui.model.json.JSONModel();
			oModel2.loadData("model/model.json",null,false);
			this.getView().setModel(oModel2);
			
			/*var sURL = "proxy/http/tihaecdev.elecmetal.cl:8000/sap/opu/odata/SAP/ZUSWMMEG_HEAT_TREAT_SCH_SRV?sap-client=410";
        	var oModel = new sap.ui.model.odata.v2.ODataModel(sURL, true);
        	this.getView().setModel(oModel);
        	var oModel2 = sap.ui.getCore().getModel("JSONModel"); //get model which contains selection screen data
			var jsonData = oModel2.getData();
			
			var sWarehouse = jsonData.SelectionValue.Warehouse;
				
			var aFilters = [];
			var oWarehouse = new Filter("WarehouseNumber", sap.ui.model.FilterOperator.EQ, sWarehouse);
			var oStorageType = new Filter("StorageType", sap.ui.model.FilterOperator.EQ,"QUE");
			var oStorageBin = new Filter("StorageBin", sap.ui.model.FilterOperator.EQ, "STAGE");
			
			aFilters.push(oWarehouse);
			aFilters.push(oStorageType);
			aFilters.push(oStorageBin);
        	this.byId("IDtableTrayDetails").getBinding().filter(aFilters, "Application");*/
		},

		onBack : function(){
			this.getView().invalidate();
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getOwnerComponent().getRouter().navTo("page1", null, true);
			}
		},
		
		onScheduleSelected: function(){
			iSelectedSU = 0;
			var aSelected = this.getView().byId("IDtableTrayDetails").getSelectedIndices();
			if(aSelected.length > 0){
				for(var c = 0;c<aSelectedSU.length;c++){
					if(aSelectedSU[c] !== undefined){
						iSelectedSU = iSelectedSU + 1;
					}
				}
				MessageToast.show(iSelectedSU + " selected storage units",null,1000);
				if (!this._oDialog2) {
					this._oDialog2 = sap.ui.xmlfragment("ey.meg.root.fragments.Bin", this);
					this._oDialog2.setModel(this.getView().getModel());
				}
				this._oDialog2.open();
			}
			else{
				MessageToast.show("Please selected valid rows");
			}
			
		},
		
		handleConfirmBin: function(){
			var sBin = sap.ui.getCore().byId("IDbin").getValue();
			if(sBin.length > 0){
				var oJSONModel = new sap.ui.model.json.JSONModel();
        		sap.ui.getCore().setModel(oJSONModel,"JSONModel");
        		sap.ui.getCore().getModel("JSONModel").setProperty("/ScheduleNewTray",{
        			"Bin": sBin,
        			"StorageUnits": aSelectedSU,
        			"Operation": sOperation,
        			"MinutesRemain": 120
        		});
				
				this.getOwnerComponent().getRouter().navTo("page2", null, true);
				sap.ui.getCore().byId("__xmlview2").invalidate();
				oThis_View.invalidate();
			}
		},
		
		handlevaluehelpBin: function(){
			if (!this._oDialog3) {
				this._oDialog3 = sap.ui.xmlfragment("ey.meg.root.fragments.BinList", this);
				this._oDialog3.setModel(this.getView().getModel());
			}
			this._oDialog3.open();
			sap.ui.getCore().byId("IDbinlistDialog").setModel(oModel);			
		},
		
		handleCloseBinList: function(oEvent){
			var aContexts = oEvent.getParameter("selectedContexts");
			var sSelected;
        	if (aContexts && aContexts.length) {
				sSelected = aContexts.map(function(oContext) { return oContext.getObject().name; });
				sOperation = aContexts.map(function(oContext) { return oContext.getObject().operation; });
				sap.ui.getCore().byId("IDbin").setValue(sSelected);				
			}
		},
		
		handleSearchBinList: function(oEvent){
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("name", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		
		onRowSelect: function(oEvent){
			var aSU = [];
			var bExist = false;
			var iSelectedIndex = oEvent.getParameter("rowIndex");
			var bSelected = this._isSelected(iSelectedIndex);
			if(bSelected === true){
				var jsonData = this.getView().byId("IDtableTrayDetails").getRows();
				var oRowContext = this.getView().byId("IDtableTrayDetails").getContextByIndex(iSelectedIndex);
				if (oRowContext) {
					   var oRowObject = oRowContext.getObject();
					   var sSU = oRowContext.getProperty("StorageUnit");
				}
				for(var i = 0;i<jsonData.length;i++){
					var oRowContext2 = this.getView().byId("IDtableTrayDetails").getContextByIndex(i);
					if (oRowContext2) {
						   if(oRowContext2.getProperty("StorageUnit") === sSU){
								aSU.push(i);
							}
					}
				}
				this.getView().byId("IDtableTrayDetails").addSelectionInterval(aSU[0],aSU[aSU.length-1]);
				if(aSelectedSU.length > 0){
					for(var b = 0;b<aSelectedSU.length;b++){
						if(sSU === aSelectedSU[b]){
							bExist = true;
							break;
						}
					}
					if(bExist === false){
						aSelectedSU.push(sSU);
					}
				}
				else{
					aSelectedSU.push(sSU);
				}
			}
			else if(bSelected === false){
				var jsonData = this.getView().getModel().getData().NewTrayDetails;
				var sSU = jsonData[iSelectedIndex].StorageUnit;
				for(var a = 0;a<jsonData.length;a++){
					if(jsonData[a].StorageUnit === sSU){
						aSU.push(a);
					}
				}
				this.getView().byId("IDtableTrayDetails").removeSelectionInterval(aSU[0],aSU[aSU.length-1]);
				for(var b = 0;b<aSelectedSU.length;b++){
					if(sSU === aSelectedSU[b]){
						delete aSelectedSU[b];
						break;
					}
				}
			}			
		},
		
		_isSelected: function(iIndex){
			var bSelected;
			var aSelectedIndices = this.getView().byId("IDtableTrayDetails").getSelectedIndices();
			for(var i = 0;i<aSelectedIndices.length;i++){
				if(aSelectedIndices[i] === iIndex){
					bSelected = true;
					break;
				}
				else{
					bSelected = false;
				}
			}
			return bSelected;
		}

	});

});
