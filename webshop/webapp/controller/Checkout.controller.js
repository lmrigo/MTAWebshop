jQuery.sap.require("com.sap.espm.shop.model.format");
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"com/sap/espm/shop/model/formatter",
	"sap/ui/core/UIComponent",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox"
], function(Controller, formatter, UIComponent, ODataModel, JSONModel, History, MessageBox) {
	"use strict";
		var oDataModel;
		var customerId = "";
		
	return Controller.extend("com.sap.espm.shop.controller.Checkout", {
		
		formatter: formatter,
		cardType: "american",
		onInit:function() {
			var that = this;
			var oCheckoutTemplate = new sap.m.ColumnListItem({
				cells:[
					new sap.m.Image({
						src : "/images/{PictureUrl}",
						decorative : false,
						densityAware : false,
						height : "3rem",
						width : "3rem"
					}),
					new sap.m.ObjectIdentifier({
						title : "{Name}"
					}),
					new sap.m.Text({
						text : "{Quantity}"
					}), 
					new sap.m.ObjectNumber({
						emphasized : false,
						id : "checkoutPrice",
						number : "{path: 'Price', formatter:'com.sap.espm.shop.model.format.formatAmount'}",
						unit : "{CurrencyCode}"
					}),
					new sap.m.ObjectNumber({
						number : "{path: 'Total', formatter:'com.sap.espm.shop.model.format.formatAmount'}",
						id : "checkoutCurrency",
						unit : "{CurrencyCode}"
					})
				]
			});
			var oComponent = this.getOwnerComponent();
			var model = oComponent.getModel("Cart");
			var oCheckoutTable = this.getView().byId("checkoutCartTable");
			oCheckoutTable.setModel(model);
			oCheckoutTable.bindItems("/ShoppingCart",oCheckoutTemplate);
			
			this.getView().addEventDelegate({
				onAfterShow: function() {
					that.onAddCountToCart();
			}});
			this._oView = this.getView();
			this._oTotalFooter = this.byId("totalFooter");
			this._oExistingForm = this.byId("existingFormId");
			this._oNewForm = this.byId("newFormId");
			////wizard 
			this._wizard = this.getView().byId("checkoutWizard");
			this._oNavContainer = this.getView().byId("wizardNavContainer");
			this._oWizardReviewPage = sap.ui.xmlfragment("com.sap.espm.shop.view.fragment.ReviewPage", this);
			this._oNavContainer.addPage(this._oWizardReviewPage);
			this._oWizardContentPage = this.getView().byId("checkoutContentPage");
			
			var oreviewTable = sap.ui.getCore().byId("reviewCartTable");
			oreviewTable.setModel(model);
			oreviewTable.bindItems("/ShoppingCart",oCheckoutTemplate);
			
			//model for countries in the UI
			var ocountryModel = new JSONModel(); 
			ocountryModel.loadData("model/countries.json");
			this.getView().byId("countryListId").setModel(ocountryModel, "countryModel");
			
			var today = new Date();
			this.getView().byId("birthId").setMaxDate(today);
			
		},
		onAfterRendering: function() 
		{
		
		},
		onBeforeRendering: function() 
		{
		
		},
		onNavBack: function () {
			window.history.go(-1);
		},
		onAddCountToCart: function(){
			var totalQuantity = 0;
			var subTotal = 0;
			var currency;
			var oModel = this.getView().getModel("Cart");
			var data = oModel.getProperty("/ShoppingCart");
			if(data){
				for(var i = 0; i < data.length; i++){
					var prodId = data[i];
					totalQuantity += prodId.Quantity;
					subTotal += prodId.Total;
					currency = "EUR";
				}
				this.getView().byId("btnShoppingCartHeader").setText(totalQuantity);
				
				subTotal = formatter.formatAmount(subTotal);
				this._oTotalFooter.setNumber(subTotal);
				this._oTotalFooter.setUnit(currency);
				sap.ui.getCore().byId("totalFooter").setNumber(subTotal);
				sap.ui.getCore().byId("totalFooter").setUnit(currency);
			} else {
				this._oTotalFooter.setNumber("");
				this._oTotalFooter.setUnit("");
			}
		},
		_handleMessageBoxOpen : function (sMessage, sMessageBoxType) {
			var that = this;
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						that._handleNavigationToStep(0);
						that._wizard.discardProgress(that._wizard.getSteps()[0]);
					}
				}
			});
		},
		_handleNavigationToStep : function (iStepNumber) {
			var that = this;
			function fnAfterNavigate () {
				that._wizard.goToStep(that._wizard.getSteps()[iStepNumber]);
				that._oNavContainer.detachAfterNavigate(fnAfterNavigate);
			}
			this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
			this.backToWizardContent();
		},
		discardProgress: function () {
			this._wizard.discardProgress(this.getView().byId("ProductTypeStep"));
			var clearContent = function (content) {
				for (var i = 0; i < content.length; i++) {
					if (content[i].setValue) {
						content[i].setValue("");
					}

					if (content[i].getContent) {
						clearContent(content[i].getContent());
					}
				}
			};
			clearContent(this._wizard.getSteps());
		},
		wizardCompletedHandler : function () {
			
			//get the resource bundle
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			//validation of input
			var validationFlag = true;
			var myInteger = (/^-?\d*(\.\d+)?$/);
			var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;	
			
			var firstName = this.byId("firstNameId").getValue();
			var lastName = this.byId("lastnameId").getValue();
			var birthDate = this.byId("birthId").getValue();
			var eMail = this.byId("newEmailId").getValue().toLowerCase();
			var street = this.byId("streetId").getValue();
			var houseNumber = this.byId("houseNumberId").getValue();
			var city = this.byId("cityId").getValue();
			var postalCode = this.byId("postalId").getValue();
			var country = this.byId("countryListId").getSelectedKey();
			var name = this.byId("nameId").getValue();
			var cardNumber = this.byId("numberId").getValue();
			var secNumber = this.byId("securityId").getValue();
			
			if (!eMail.match(mailregex)) {
				validationFlag = false;
			}
			if(this.getView().byId("birthId").getValueState() === "Error"){
				validationFlag = false;
			}
			if (validationFlag === false || 
				firstName.length === 0 || 
				lastName.length === 0 || 
				birthDate.length === 0 || 
				eMail.length === 0 || 
				street.length === 0 || 
				city.length === 0 || 
				postalCode.length === 0 || 
				country.length === 0 ||
				name.length === 0 || 
				cardNumber.length === 0 || 
				secNumber.length === 0 || 
				(!houseNumber.match(myInteger)) === true || 
				(!postalCode.match(myInteger)) === true || 
				(name.match(myInteger)) === true || 
				(!cardNumber.match(myInteger)) === true ||
				firstName.match(myInteger) === true || 
				lastName.match(myInteger) === true || 
				street.match(myInteger) === true || 
				city.match(myInteger) === true || 
				country.match(myInteger) === true) {

				sap.m.MessageToast.show(oBundle.getText("soPopup.errorMessage"));
			} else {
				sap.ui.getCore().byId("firstname").setText(this.byId("firstNameId").getValue());
				sap.ui.getCore().byId("lastName").setText(this.byId("lastnameId").getValue());
				sap.ui.getCore().byId("dateBirth").setText(this.byId("birthId").getValue());
				sap.ui.getCore().byId("houseNumber").setText(this.byId("houseNumberId").getValue());
				sap.ui.getCore().byId("emailAddress").setText(this.byId("newEmailId").getValue());
				sap.ui.getCore().byId("street").setText(this.byId("streetId").getValue());
				sap.ui.getCore().byId("city").setText(this.byId("cityId").getValue());
				sap.ui.getCore().byId("postalCode").setText(this.byId("postalId").getValue());
				sap.ui.getCore().byId("country").setText(this.byId("countryListId").getSelectedKey());
				sap.ui.getCore().byId("cardOwner").setText(this.byId("nameId").getValue());
				sap.ui.getCore().byId("cardNumber").setText(this.byId("numberId").getValue());
				sap.ui.getCore().byId("cardImg").setSrc("Images/" + this.cardType + ".png");
				
				this._oNavContainer.to(this._oWizardReviewPage);
			}
		},
		handleWizardCancel: function(){
			this._oNavContainer.backToPage(this._oWizardContentPage.getId());
			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("Home", true);
		},
		handleWizardSubmit : function () {
			var that = this;
			this.getCustomerId();
			if (customerId.length === 0) {
				this._oWizardReviewPage.setBusy(true);
				this.createCustomer();
			} else {
				this._oWizardReviewPage.setBusy(true);
				this.createSalesOrder();
			}
			that.byId("radioButtonGroupId").setSelectedIndex(1);// = 1;
			that._oExistingForm.setVisible(true);
			that._oNewForm.setVisible(false);
			that.clearNewForm();
			
			
		},
		createCustomer: function(){
			var oBundle = this.getView().getModel('i18n').getResourceBundle();
			var that = this;
			var date = this.byId("birthId").getValue();
			var utctime = Date.parse(date);		
			date = "/Date("+utctime+")/";
			var customer = {
				"EmailAddress":this.byId("newEmailId").getValue().toLowerCase(),
				"LastName":this.byId("lastnameId").getValue(),
				"FirstName":this.byId("firstNameId").getValue(),
				"HouseNumber":this.byId("houseNumberId").getValue(),
				"DateOfBirth":date,
				"PostalCode":this.byId("postalId").getValue(),
				"City":this.byId("cityId").getValue(),
				"Street":this.byId("streetId").getValue(),
				"Country":this.byId("countryListId").getSelectedKey(),
				"CustomerId": (customerId === "" ? that.randomIdGenerator() : customerId)
			};
			
			var sServiceUrl = this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources.espmDataModel.uri;
			var ajaxUrl = ".." + sServiceUrl;
			$.ajax({
	            type: "POST",
	            async: true,
	            contentType:"application/json; charset=utf-8",
	            dataType: "json",
	            url: ajaxUrl + "Customers",
	            data : JSON.stringify(customer),
	            success: function(responsedata) {
            		customerId = responsedata.CustomerId;
 					that.createSalesOrder();
	            },
	            error: function() {
	                sap.m.MessageToast.show(oBundle.getText("check.customerCreateFailed"));
	            }
        	});
		},
		createSalesOrder: function(){
			var that = this;
			var sCustomerId = customerId;
			var SalesOrderHeader = {};
	
			SalesOrderHeader.SalesOrderId = that.randomIdGenerator();
			SalesOrderHeader.CustomerId = sCustomerId;
			SalesOrderHeader.GrossAmount = 0;
			SalesOrderHeader.NetAmount = 0;
			SalesOrderHeader.TaxAmount = 0;
		
			var items = [];
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var cartModel = this.getView().getModel("Cart");
			var products = cartModel.getProperty("/ShoppingCart");
			for (var i = 0; i < products.length; i++) {
				var product = products[i];
				var item = {
					"SalesOrderId": SalesOrderHeader.SalesOrderId,
					"ProductId" : product.ProductId,
					"ItemNumber" : ((i + 1) * 10),
					"Quantity" : product.Quantity,
					"QuantityUnit" : product.QuantityUnit,
					"DeliveryDate" : new Date().toISOString(),
					"CurrencyCode": product.CurrencyCode,
					"GrossAmount": product.Price,
					"NetAmount": product.Price,
					"TaxAmount": 0
				};
				items.push(item);
				SalesOrderHeader.GrossAmount += item.GrossAmount * item.Quantity;
				SalesOrderHeader.NetAmount += item.NetAmount * item.Quantity;
				SalesOrderHeader.TaxAmount += item.TaxAmount * item.Quantity;
				SalesOrderHeader.CurrencyCode = item.CurrencyCode;
			}
			SalesOrderHeader.SalesOrderItems = items;
			
			var sServiceUrl = this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources.espmDataModel.uri;
			var ajaxUrl = ".." + sServiceUrl;
			$.ajax({
	            type: "POST",
	            async: true,
	            contentType:"application/json; charset=utf-8",
	            dataType: "json",
	            url: ajaxUrl + "SalesOrderHeaders",
	            data : JSON.stringify(SalesOrderHeader),
	            success: function(resData) {
	            	// insert Sale Order Line Items
	            	$.each(SalesOrderHeader.SalesOrderItems, function(idx, soi) {
	            		$.ajax({
				            type: "POST",
				            async: true,
				            contentType:"application/json; charset=utf-8",
				            dataType: "json",
				            url: ajaxUrl + "SalesOrderItems",
				            data : JSON.stringify(soi),
				            success: function() {},
				            error: function(soiError) {
		            			jQuery.sap.log.error(soiError);
				            }
	            		});
	            	});
	            	
	            	that._oWizardReviewPage.setBusy(false);
	            	sap.m.MessageBox.information(oBundle.getText("check.soIDCreated", [resData.SalesOrderId]),{
		            	onClose: function() {
		            		that._oNavContainer.backToPage(that._oWizardContentPage.getId());
		            		var model = that.getView().getModel("Cart");
							var newArray = [];
							model.setData({ShoppingCart : newArray});
							sap.ui.getCore().byId("totalFooter").setNumber("");
							sap.ui.getCore().byId("totalFooter").setUnit("");
							that.getView().byId("existingCustomerId").setSelected(true);
							var oRouter = UIComponent.getRouterFor(that);
							oRouter.navTo("Home", true);
	            		}
		            });
	            },
	            error: function() {
	            	sap.m.MessageToast.show(oBundle.getText("soPopup.errorMessage"));
	                that._oWizardReviewPage.setBusy(false);
	            }
        	}); //SalesOrderHeaders
		},
		backToWizardContent : function () {
			this._oNavContainer.backToPage(this._oWizardContentPage.getId());
		},
		radioButtonSelected: function(oEvent){
			var buttonId = oEvent.getSource().getSelectedIndex();
			if(buttonId === 0){
				this._oExistingForm.setVisible(true);
				this._oNewForm.setVisible(false);
				this._wizard.validateStep(this.getView().byId("creditCardStep"));
				this.clearNewForm();
			} else {
				this._oExistingForm.setVisible(false);
				this._oNewForm.setVisible(true);
				this._wizard.validateStep(this.getView().byId("creditCardStep"));
				this.clearNewForm();
			}
		},
		
		getCustomerId: function(){
			var that = this;
			customerId = "";
			var buttonIndex = that.getView().byId("radioButtonGroupId").getSelectedIndex();
			var email;
			// var sFunctionImportEmailParam;
			if (buttonIndex === 1) {
				if(that.byId("newEmailId").getValue().length !== 0){
					// sFunctionImportEmailParam = "EmailAddress='" + that.byId("newEmailId").getValue().toLowerCase() + "'";
					email = that.byId("newEmailId").getValue().toLowerCase();
				}
			} else {
				if (that.byId("existingEmailId").getValue().length !== 0) {
					// sFunctionImportEmailParam = "EmailAddress='" + this.byId("existingEmailId").getValue().toLowerCase() + "'";
					email = this.byId("existingEmailId").getValue().toLowerCase();
				}
			}
			
			// adapted due to JSONModel
			var model = this.getView().getModel("EspmModel");
			var customers = model.getProperty("/Customers");
			var customer = customers.find(function(x) {
				return x.EmailAddress === email;
			});
			if (customer !== undefined) {
				customerId = customer.CustomerId;
			} else {
				customerId = "";
			}
		},
		
		checkExistingEmailId: function(){
			var that = this;
			var oBundle = this.getView().getModel('i18n').getResourceBundle();
			if(this.validateEmail(this.byId("existingEmailId").getValue()) === true){
				
				// adapted due to JSONModel
				var email = this.byId("existingEmailId").getValue().toLowerCase();
				var model = this.getView().getModel("EspmModel");
				var customers = model.getProperty("/Customers");
				var customer = customers.find(function(x) {
					return x.EmailAddress === email;
				});
				
				if (customer === undefined) {
 					sap.m.MessageToast.show(oBundle.getText("check.customerNotExist"));
 					
 					that.byId("radioButtonGroupId").setSelectedIndex(1);// = 1;
 					that._oExistingForm.setVisible(false);
					that._oNewForm.setVisible(true);
					that._wizard.validateStep(that.getView().byId("creditCardStep"));
 					that.byId("newEmailId").setValue(that.byId("existingEmailId").getValue());
 					that.byId("firstNameId").setValue("");
 					that.byId("houseNumberId").setValue("");
 					that.byId("lastnameId").setValue("");
 					that.byId("newEmailId").setValue("");
 					that.byId("birthId").setValue("");
 					that.byId("streetId").setValue("");
 					that.byId("cityId").setValue("");
 					that.byId("countryListId").setSelectedKey("");
 					that.byId("postalId").setValue("");
 					that.byId("nameId").setValue("");
 					that.byId("numberId").setValue("");
 					that.byId("securityId").setValue("");
 					//customerId = "";
	 			} else {
 					// var result = data.results[0];
 					that.byId("firstNameId").setValue(customer.FirstName);
 					that.byId("houseNumberId").setValue(customer.HouseNumber);
 					that.byId("lastnameId").setValue(customer.LastName);
 					that.byId("newEmailId").setValue(customer.EmailAddress);
 					var custDate = customer.DateOfBirth;
 					if (custDate.includes("Date")) {
 						custDate = Number(custDate.replace(/\D/g,''));
 					}
 					that.byId("birthId").setDateValue(new Date(custDate));
 					that.byId("streetId").setValue(customer.Street);
 					that.byId("cityId").setValue(customer.City);
 					that.byId("countryListId").setSelectedKey(customer.Country);
 					that.byId("postalId").setValue(customer.PostalCode);
 					that.byId("nameId").setValue(customer.FirstName+" "+customer.LastName);
 
 					that._oExistingForm.setVisible(false);
					that._oNewForm.setVisible(true);
					that._wizard.validateStep(that.getView().byId("creditCardStep"));
					that.byId("radioButtonGroupId").setSelectedIndex(0);
					//customerId = customer.CustomerId;
 				}
			}
		},
		validateEmail: function(mail){
			var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;	
			var oBundle = this.getView().getModel('i18n').getResourceBundle();
			if(typeof(mail) === "object"){
				mail = mail.getSource().getValue();
			}
			if (mail.match(mailregex)) {
				return (true);
			} else {
				sap.m.MessageToast.show(oBundle.getText("soPopup.invalidEmailAddress")); 
			}
		},
		validateNumberInputField: function(oEvent){
			var myInteger = (/^-?\d*(\.\d+)?$/);
			if( !oEvent.getSource().getValue().match(myInteger) ){
				oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
			} else {
				oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
			}
		},
		validateStringInputField: function(oEvent){
			var myInteger = (/^-?\d*(\.\d+)?$/);
			if( oEvent.getSource().getValue().match(myInteger) ){
				oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
			} else {
				oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
			}
		},
		
		valueChanged: function() {
			this.byId("nameId").setValue(this.byId("firstNameId").getValue() + " " + this.byId("lastnameId").getValue());
		},
		
		checkCustomerInformation: function(){
			if (this.byId("firstNameId").getValue().length === 0 || this.byId("lastnameId").getValue().length === 0
			|| this.byId("birthId").getValue().length === 0 || this.byId("newEmailId").getValue().length === 0
			|| this.byId("streetId").getValue().length === 0 || this.byId("cityId").getValue().length === 0
			//|| this.byId("houseNumberId").getValue().length === 0 
			|| this.byId("postalId").getValue().length === 0 || this.byId("countryListId").getSelectedKey().length === 0) {
				this._wizard.invalidateStep(this.getView().byId("creditCardStep"));
			} else {
				this._wizard.validateStep(this.getView().byId("creditCardStep"));
			}
		},
		
		addMoreProducts: function(){
			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("Home", true);
		},
		
		formatCustomerLocation: function(location){
			 return formatter.formatCountryName(location);
		},
		
		clearNewForm: function(){
			this.byId("newEmailId").setValue("");
			this.byId("firstNameId").setValue("");
			this.byId("lastnameId").setValue("");
			this.byId("houseNumberId").setValue("");
			this.byId("birthId").setValue("");
			this.byId("streetId").setValue("");
			this.byId("cityId").setValue("");
			this.byId("countryListId").setSelectedKey("");
			this.byId("postalId").setValue("");
			this.byId("nameId").setValue("");
			this.byId("numberId").setValue("");
			this.byId("securityId").setValue("");
			this.byId("existingEmailId").setValue("");
		},
		
		validateDateField: function(oEvent){
			if(!oEvent.getParameter("valid")){
				oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
			} else {
				oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
			}
		},

		onRbChange: function(oEvent){
			this.cardType = oEvent.getSource().data("cardtype");
		},
		randomIdGenerator: function() {
			return Math.random().toString(36).replace(/\D+/g, '').concat("0000000000").substr(0, 10);
		}

	});

});