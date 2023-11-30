sap.ui.define([
  'sap/ui/core/mvc/Controller',
  'sap/m/Panel',
  'sap/m/Text',
  'sap/m/MessageToast',
  'sap/ui/model/Filter',
  'sap/ui/layout/HorizontalLayout',
  'sap/ui/layout/VerticalLayout',
  'sap/m/Label',
  'sap/m/Input',
  'sap/m/MessageBox'
], function (Controller,Panel,Text,MessageToast,Filter,HorizontalLayout,VerticalLayout,Label,Input,MessageBox) {
  "use strict";
  var sWarehouse;
  var PageController = Controller.extend("ey.meg.root.controller.Selection", {
      onInit: function () {
        var sDefWarehouse;
        var oThat = this;
        var sURL = "/sap/opu/odata/SAP/ZUSPPMEG11E_HEAT_TREAT_SCH_SRV/";
        var oModel = new sap.ui.model.odata.v2.ODataModel(sURL, true);
        this.getView().setModel(oModel);

        var oModel1 = new sap.ui.model.odata.ODataModel(sURL, true);
        oModel1.read("/WarehouseSet", {
          success: function(oData, response){
              console.log(oData);
              if(oData.results.length > 0){
                sDefWarehouse = oData.results[0].Lgnum;
                oThat.getView().byId("IDwarehouse").setValue(sDefWarehouse);
              }

              },
            error:  function(oError){
              MessageBox.warning(
                "Default Warehouse number not maintained",
                {
                  icon: MessageBox.Icon.WARNING,
                  title: "",
                  actions: [sap.m.MessageBox.Action.OK],
                  initialFocus: MessageBox.Action.OK
                }
            );
         }});
      },

      handleLiveChange: function(oEvent){
        var sNewValue = oEvent.getParameter("value");
        var sId = oEvent.getSource().getId();
        if(sNewValue.length > 0){
          this.getView().byId(sId).setProperty("valueState", "None");
        }
      },

      onSubmit: function(){
        sap.ui.core.BusyIndicator.show();
        sWarehouse = this.getView().byId("IDwarehouse").getValue();
        if(sWarehouse.length > 0){
          var oThat = this;
          var sPath = "/HTSWarehouseSearchSet('" + sWarehouse + "')"
          var sURL = "/sap/opu/odata/SAP/ZUSPPMEG11E_HEAT_TREAT_SCH_SRV/";
          var oModel = new sap.ui.model.odata.ODataModel(sURL, true);
          oModel.read(sPath, {
            success: function(oData, response){
              var oJSONModel = new sap.ui.model.json.JSONModel();
                sap.ui.getCore().setModel(oJSONModel,"JSONModel");
                sap.ui.getCore().getModel("JSONModel").setProperty("/SelectionValue",{
                  "Warehouse": sWarehouse
                });
                oThat.getOwnerComponent().getRouter().navTo("page2");
                var oView = sap.ui.getCore().byId("__xmlview2");
                if(oView !== undefined){
                  oView.invalidate();
                }
                },
              error:  function(oError){
                  sap.ui.core.BusyIndicator.hide();
                  MessageToast.show("Warehouse " + sWarehouse + " does not exist",null,1000);
                  oThat.getView().byId("IDwarehouse").setProperty("valueState","Error");
                }});
        }
        else{
          this.getView().byId("IDwarehouse").setProperty("valueState","Error");
          MessageToast.show("Please indicate Warehouse",null,1000);
        }
      },

      handlevaluehelpWarehouse: function(){
        if (!this._oDialog) {
          this._oDialog = sap.ui.xmlfragment("ey.meg.root.fragments.WarehouseList", this);
          this._oDialog.setModel(this.getView().getModel());
        }
        this._oDialog.open();
        var oFilter = new Filter("SearchType", sap.ui.model.FilterOperator.EQ, "W");
        var oBinding = sap.ui.getCore().byId("IDwarehouselistDialog").getBinding("items");
        oBinding.filter([oFilter]);
      },

      handleCloseWarehouseList: function(oEvent){
        var aContexts = oEvent.getParameter("selectedContexts");
        var sSelected;
            if (aContexts && aContexts.length) {
              sSelected = aContexts.map(function(oContext) { return oContext.getObject().Warehouse; });
          this.getView().byId("IDwarehouse").setValue(sSelected)
          this.getView().byId("IDwarehouse").setProperty("valueState", "None");
        }
      },

      handleSearchWarehouseList: function(oEvent) {
        var sValue = oEvent.getParameter("value");
        var aFilters = [];
        var oFilterSearchType = new Filter("SearchType", sap.ui.model.FilterOperator.EQ, "W");
        var oFilterWarehouse = new Filter("Warehouse", sap.ui.model.FilterOperator.EQ, sValue);
        aFilters.push(oFilterSearchType);
        aFilters.push(oFilterWarehouse);
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter(aFilters);
      },

  });

  return PageController;

});