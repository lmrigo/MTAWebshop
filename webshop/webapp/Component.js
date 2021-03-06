sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/sap/espm/shop/model/models",
	"sap/m/MessageToast"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("com.sap.espm.shop.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			//initialize router
			
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			var sServiceUrl = this.getMetadata().getManifestEntry("sap.app").dataSources.espmDataModel.uri;
			// var oEspmModel = new sap.ui.model.odata.ODataModel(sServiceUrl, {json: true, loadMetadataAsync: true});
			var oEspmModel = new sap.ui.model.odata.v4.ODataModel({
				serviceUrl: sServiceUrl,
				synchronizationMode : "None",
				operationMode: "Server",
				groupId: "$direct",
				updateGroupId : "$auto",
				autoExpandSelect : true,
				groupProperties: {
					"myAutoGroup" : {"submit" : "Auto"},
					"myDirectGroup" : {"submit" : "Direct"}
				}
			});
			// this.setModel(oEspmModel,"EspmModel");
			var that = this;
			var ajaxUrl = ".." + sServiceUrl;
			var failFunction = function(data,msg,req) {
				jQuery.sap.log.error(data,msg,req);
			};
			var jEspmModel = new sap.ui.model.json.JSONModel({});
			this.setModel(jEspmModel,"EspmModel");
			var entities = ["ProductCategories","Stocks","ProductTexts"];
			$.each(entities, function(idx, entity){
				$.get(ajaxUrl + entity)
				.done(function(data,msg,req){
					var model = that.getModel("EspmModel");
					model.setProperty("/"+entity, data.value);
				}).fail(failFunction);
			});

			// Products, CustomerReviews and Suppliers
			$.get(ajaxUrl + "Products")
			.done(function(data,msg,req) {
				var model = that.getModel("EspmModel");
				model.setProperty("/Products", data.value);
				
				$.when($.get(ajaxUrl+"CustomerReviews"),$.get(ajaxUrl + "Suppliers"))
				.then(function(resReviews,resSuppliers) {
					var products = model.getProperty("/Products");
					// Reviews
					var dataReviews = resReviews[0];
					$.each(dataReviews.value, function(ri, rev) {
						var pi = products.findIndex(function(x) {
							return x.ProductId === rev.ProductId;
						});
						if (products[pi].CustomerReviews === undefined) {
							products[pi].CustomerReviews = [];
						}
						products[pi].CustomerReviews.push(rev);
					});
					model.setProperty("/CustomerReviews", dataReviews.value);
					
					// Suppliers
					var dataSuppliers = resSuppliers[0];
					$.each(products, function(pi, prod) {
						var sup = dataSuppliers.value.find(function(x) {
							return x.SupplierId === prod.SupplierId;
						});
						prod.Supplier = sup;
					});
					model.setProperty("/Suppliers", dataSuppliers.value);

					// update Products model
					model.setProperty("/Products", products);
				},failFunction);
			}).fail(failFunction);
			
			// Customers, SalesOrderHeaders and SalesOrderItems
			$.get(ajaxUrl + "Customers")
			.done(function(data,msg,req) {
				var customers = data.value;
				var model = that.getModel("EspmModel");
				model.setProperty("/Customers", customers);
				
				$.get(ajaxUrl + "SalesOrderHeaders")
				.done(function(sodata,somsg,soreq) {
					// SO Headers
					var SOHeaders = sodata.value;
					$.each(SOHeaders, function(soi, soh) {
						var ci = customers.findIndex(function(x) {
							return x.CustomerId === soh.CustomerId;
						});
						/*** Commented due to circular reference using JSONModel ***/
						// if (customers[ci].SalesOrders === undefined) {
						// 	customers[ci].SalesOrders = [];
						// }
						// customers[ci].SalesOrders.push(soh);
						soh.Customer = customers[ci];
					});
					
					$.get(ajaxUrl + "SalesOrderItems")
					.done(function(idata,imsg,ireq) {
						// SO Items
						var items = idata.value;
						$.each(items, function(idx, item) {
							var sohi = SOHeaders.findIndex(function(x) {
								return x.SalesOrderId === item.SalesOrderId;
							});
							if (SOHeaders[sohi].SalesOrderItems === undefined) {
								SOHeaders[sohi].SalesOrderItems = [];
							}
							SOHeaders[sohi].SalesOrderItems.push(item);
							// item.SalesOrderHeader = SOHeaders[sohi]; // Commented due to circular reference using JSONModel
						});
						model.setProperty("/SalesOrderItems", items);
						model.setProperty("/SalesOrderHeaders", SOHeaders);
					}).fail(failFunction);
					
					model.setProperty("/Customers", customers);
				}).fail(failFunction);
			}).fail(failFunction);
			var oData ={
				ShoppingCart:[]
			};
			var oModel = new sap.ui.model.json.JSONModel(oData);
			this.setModel(oModel,"Cart");
			
			this.getRouter().initialize();
		}
	});

});