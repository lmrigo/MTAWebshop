sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"com/sap/espm/shop/model/formatter",
	"com/sap/espm/shop/model/utility",
	"sap/ui/core/UIComponent",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/BusyDialog",
	"sap/m/MessageToast",
	"sap/m/SelectDialog"
], function(Controller, formatter, utility, UIComponent, Sorter, Filter, FilterOperator,
			BusyDialog, MessageToast, SelectDialog) {
	"use strict";


	return Controller.extend("com.sap.espm.shop.controller.Home", {
		
		formatter: formatter,
		utility: utility,
		onInit:function()
		{
			this._oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this._oCombobox = this.byId("categoryListId");
			
			var oComponent = this.getOwnerComponent();
			var oModel = oComponent.getModel("Cart");
			var espm = oComponent.getModel("EspmModel");
			espm.setProperty("TotalQuantity", 0);
			var that = this;
			this.getView().addEventDelegate({
				onAfterShow: function() {
					var count = formatter.onAddCountToCart(oModel);
					that.getView().byId("btnProductListHeader").setText(count);
				}
			});
			
			this.mGroupFunctions = {
				Category: function(oContext) {
					var name = oContext.getProperty("Category");
					return {
						key: name,
						text: name
					};
				}, 
				Price: function(oContext) {
					var price = oContext.getProperty("Price");
					var currencyCode = oContext.getProperty("CurrencyCode");
					var key, text;
					if (price <= 100) {
						key = "LE100";
						text = "100 " + currencyCode + " or less";
					} else if (price <= 1000) {
						key = "BT100-1000";
						text = "Between 100 and 1000 " + currencyCode;
					} else {
						key = "GT1000";
						text = "More than 1000 " + currencyCode;
					}
					return {
						key: key,
						text: text
					};
				}
			};
			
		},
		onAfterRendering: function() 
		{
		},
		onBeforeRendering: function() 
		{
		},
		onLineItemPressed: function(event) {
			// adapted due to JSONModel
			var model = this.getView().getModel("EspmModel");
	        var bindingContextPath = event.getSource().getBindingContextPath();
	        var productContext = model.getProperty(bindingContextPath);
	        var detailsPath = bindingContextPath.substr(1,bindingContextPath.lastIndexOf("/")-1)+"("+productContext.ProductId+")";
	        
			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("ProductDetail",{Productdetails:detailsPath});
		},
		onAddToCartHomePressed: function(oEvent){
			// get binded model
			var oModel = this.getView().getModel("Cart");
			var model = this.getView().getModel("EspmModel");
			var path = oEvent.getSource().getParent().getBindingContextPath();
			var productContext = model.getProperty(path);
			formatter.onAddToCart(oModel,productContext);
			this.getView().byId("btnProductListHeader").setText(formatter.onAddCountToCart(oModel));
		},
		onShoppingCartPressed: function(){
			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("Shoppingcart");
		},
		/// Table Operations
		onSearchPressed : function(event){
 
			var searchString = event.mParameters.query;
			var oTable = this.getView().byId("catalogTable");
			var binding = oTable.getBinding("items");
			var enabledFilters = binding.aFilters; 
			// enabledFilters = [];
			
			var newFilters = []; 
			enabledFilters.forEach(function(enabledFilter) { 
				newFilters.push(enabledFilter);
			});
			
			var filter = new Filter("Name", FilterOperator.Contains, searchString);
			newFilters.push(filter);
			if(this._oCombobox.getValue().length === 0){
				binding.filter(filter);
			} else {
				binding.filter( [ new Filter([
	                                           new Filter("Category", FilterOperator.EQ, this._oCombobox.getValue()),
	                                           new Filter("Name", FilterOperator.Contains, searchString)
	                                        ],true)]);
			}
		},
		_createDialog: function(sDialog) {
			var oDialog = sap.ui.xmlfragment(sDialog, this);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oView, oDialog);
			this.getView().addDependent(oDialog);
			return oDialog;
		},
		onSortPressed: function() {
			if (!this._oSortDialog) {
				this._oSortDialog = this._createDialog("com.sap.espm.shop.view.fragment.ProductSortDialog");
			}
			this._oSortDialog.open();
		},

		// Handler for the Confirm button of the sort dialog. Depending on the selections made on the sort
		// dialog, the respective sorters are created and stored in the _oTableOperations object.
		// The actual setting of the sorters on the binding is done by the callback method that is handed over to
		// the constructor of the _oTableOperations object.
		onSortDialogConfirmed: function(oEvent) {
			
			var oView = this.getView();
			var oTable = oView.byId("catalogTable");

			var mParams = oEvent.getParameters();
			var oBinding = oTable.getBinding("items");
			
			var sPath = mParams.sortItem.getKey();
			var bDescending = mParams.sortDescending;
			var sorters = new Sorter(sPath, bDescending);
			oBinding.sort(sorters);

		},
		
		onGroupPressed: function() {
			if (!this._oGroupDialog) {
				this._oGroupDialog = this._createDialog("com.sap.espm.shop.view.fragment.ProductGroupingDialog");
			}
			this._oGroupDialog.open();
		},
		onGroupingDialogConfirmed: function(oEvent) {
			
			var oView = this.getView();
			var oTable = oView.byId("catalogTable");

			var mParams = oEvent.getParameters();
			var oBinding = oTable.getBinding("items");
			var sorters = [];
			if (mParams.groupItem) {
				var sPath = mParams.groupItem.getKey();
				var bDescending = mParams.groupDescending;
				var vGroup = this.mGroupFunctions[sPath];
				sorters = new Sorter(sPath, bDescending, vGroup);
				
			}
			oBinding.sort(sorters);
			
			
		},
		handleSelectionFinish: function(oEvent){
			
			var oTable = this.getView().byId("catalogTable");
			var binding = oTable.getBinding("items");
			var model = this.getView().getModel("EspmModel");
			
			var oFilter = new Filter("Category", FilterOperator.EQ, oEvent.getSource().getValue());  
			binding.filter(oFilter, sap.ui.model.FilterType.Control);
		},
		
		onResetPressed: function(){
			
			var oTable = this.getView().byId("catalogTable");
			// oTable.getBinding("items").filter(null);
			// oTable.getBinding("items").sort(null);
			var binding = oTable.getBinding("items");
			binding.filter(null);
			binding.sort(null);
			
			this.getView().byId("searchField").setValue("");
			this._oCombobox.setValue("");
			
		},
		
		onOrdersButtonPressed: function(){
			
			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("SalesOrder");
		},
		
		
		// Machine Learning functionality methods  -------------------------------------------------------------------
		
		handleTypeMismatch: function(oEvent) {
			var aFileTypes = oEvent.getSource().getFileType();
			jQuery.each(aFileTypes, function(key, value) {
				aFileTypes[key] = "*." + value;
			});
			var sSupportedFileTypes = aFileTypes.join(", ");
			var msg = this._oResourceBundle.getText("fileTypeMismatch",
				[ oEvent.getParameter("fileType"), sSupportedFileTypes]);
			MessageToast.show(msg);
		},
		
		handleFileSizeExceed: function(oEvent) {
			var msg = this._oResourceBundle.getText("fileSizeExceed",
				[ oEvent.getParameter("fileName"),
				Number.parseFloat(oEvent.getParameter("fileSize")).toFixed(2)]);
			MessageToast.show(msg);
		},

		handleValueChange: function(oEvent) {
			// keep a reference in the view to close it later
			var oBusyDialog = new BusyDialog();
			// start the busy indicator
			oBusyDialog.open();

			var oModel = this.getView().getModel("settings");
			sap.ui.getCore().setModel(oModel, "mlSvc");

			var reader = new FileReader();
			reader.onloadend = function() {
				oModel.setProperty("image", reader.result);
				oModel.refresh();
			};
			
			this.setupModel(oModel);
			if(oEvent.getParameters().files[0] !== undefined) {
				reader.readAsDataURL(oEvent.getParameters().files[0]);
				this.callAPI(oModel.getData(), oEvent.getParameters().files[0], oModel, oBusyDialog);
			} else {
				oBusyDialog.close();
			}
			// clear selection
			var uploader = oEvent.getSource();
			uploader.setValue("");
		},
		
		callAPI: function(oMlSvc, file, oModel, oBusyDialog) {
			var that = this;
			var form = new FormData();
			form.append("files", file);
			if (!(typeof oMlSvc.options === "undefined")) {
				form.append("options", JSON.stringify(oMlSvc.options));
			}
			
			$.ajax({
				url: oMlSvc.url,
				type: "POST",
				headers: oMlSvc.headers,
				data: form,
				processData: false,
				contentType: false,
				success: function(data) {
					try {
						var results = oModel.getProperty("/results");
						for (var j = 0; j < results.length; j++) {
							if (data.predictions[0].results[j].score > 0.01) {
								results[j].score = Math.round(data.predictions[0].results[j].score * 1000) / 10;
							} else {
								results[j].score = Math.round(data.predictions[0].results[j].score * 100000) / 1000;
							}
							var l = data.predictions[0].results[j].label;
							results[j].label = ((l[0] + "").toUpperCase()) + l.substring(1, l.length);
						}
						oModel.setProperty("/results", results);
						oModel.refresh();

						var oListModel = new sap.ui.model.json.JSONModel({
							"ListData": $.map(oModel.getProperty("/results"), 
								function(x) {
									return {
										"title": x.label,
										"description": x.score + "%"
									};
								})
						});
						var item = new sap.m.StandardListItem({
							path: "/",
							title : "{SDList>title}",
						    description: "{SDList>description}",
					    });
					    var oSelectDialog = new SelectDialog({
							"title": that._oResourceBundle.getText("selectAMatch"),
							"cancel": function(oEvent) {
								oBusyDialog.close();
								oSelectDialog.destroy();
								that.onResetPressed();
							},
							"confirm": function(oEvent) {
								var oItem = oEvent.getParameters().selectedItem;
								if (oItem) {
									that.doSearch(oItem.getTitle());
								}
								oBusyDialog.close();
								oSelectDialog.destroy();
							}
						});
						oSelectDialog.bindAggregation("items", "SDList>/ListData", item);
						oSelectDialog.setModel(oListModel, "SDList");
						oSelectDialog.open();
					} catch (err) {
						oBusyDialog.close();
						//displays error message
						MessageToast.show("[Caught error] :" + err.message);
					}
				},
				error: function(request, status, error) {
					// console.log(request, status, error);
					oBusyDialog.close();
					//displays error message
					MessageToast.show(that._oResourceBundle.getText("errorProcessingImage"));
					// MessageToast.show("[ajax error] :" + request.responseText + ", " + request.readyState + ", " + request.status + ", " + status + ", " + error);
				}
			});
		},
		
		setupModel: function(oModel) {
			var m = {};
			m.results = [];
			for (var i = 0; i < 5; i++) {
				m.results[i] = {};
				m.results[i].score = [""];
				m.results[i].label = [""];
			}
			oModel.setProperty("/results", m.results);
		},
		
		doSearch: function(sTerm) {
			this._oCombobox.setValue("");
			this.getView().byId("searchField").setValue(sTerm);
			if (sTerm && sTerm.length > 1) {
				var oTable = this.getView().byId("catalogTable");
				var binding = oTable.getBinding("items");

				var terms = sTerm.split(/\s|, /);
				var newFilters = [];
				var attributes = ["Name", "ShortDescription"];//["Name", "Category"];
				$.each(attributes, function (ai, attr) {
					var fils = [];
					$.each(terms, function(ti, term) {
						fils.push(new Filter(attr, FilterOperator.Contains, term.toLowerCase()));
						fils.push(new Filter(attr, FilterOperator.Contains, term.toUpperCase()));
						var capitalizedTerm = term.toUpperCase()[0] + term.toLowerCase().substr(1);
						fils.push(new Filter(attr, FilterOperator.Contains, capitalizedTerm));
					});
					newFilters.push(new Filter({
						filters: fils,
						and: false
					}));
				});
				binding.filter(newFilters, false);
			}
		}

	});

});