package com.sap.coil.mtawebshop.service;

import java.sql.Connection;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.cloud.sdk.hana.connectivity.cds.CDSQuery;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSSelectQueryBuilder;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSSelectQueryResult;
import com.sap.cloud.sdk.hana.connectivity.cds.ConditionBuilder;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSException;
import com.sap.cloud.sdk.hana.connectivity.handler.CDSDataSourceHandler;
import com.sap.cloud.sdk.hana.connectivity.handler.DataSourceHandlerFactory;
import com.sap.cloud.sdk.service.prov.api.EntityData;
import com.sap.cloud.sdk.service.prov.api.operations.Create;
import com.sap.cloud.sdk.service.prov.api.operations.Delete;
import com.sap.cloud.sdk.service.prov.api.operations.Query;
import com.sap.cloud.sdk.service.prov.api.operations.Read;
import com.sap.cloud.sdk.service.prov.api.operations.Update;
import com.sap.cloud.sdk.service.prov.api.request.CreateRequest;
import com.sap.cloud.sdk.service.prov.api.request.DeleteRequest;
import com.sap.cloud.sdk.service.prov.api.request.QueryRequest;
import com.sap.cloud.sdk.service.prov.api.request.ReadRequest;
import com.sap.cloud.sdk.service.prov.api.request.UpdateRequest;
import com.sap.cloud.sdk.service.prov.api.response.CreateResponse;
import com.sap.cloud.sdk.service.prov.api.response.DeleteResponse;
import com.sap.cloud.sdk.service.prov.api.response.ErrorResponse;
import com.sap.cloud.sdk.service.prov.api.response.QueryResponse;
import com.sap.cloud.sdk.service.prov.api.response.ReadResponse;
import com.sap.cloud.sdk.service.prov.api.response.UpdateResponse;


public class ESPMService {

	Logger logger = LoggerFactory.getLogger(ESPMService.class);

	private static Connection getConnection() {
		Connection conn = null;
		Context ctx;
		try {
			ctx = new InitialContext();
			conn = ((DataSource) ctx.lookup("java:comp/env/jdbc/java-hdi-container")).getConnection();
		} catch (Exception e) {
			e.printStackTrace();
		}
		return conn;
	}

	private List<EntityData> getEntitySet(QueryRequest queryRequest, String sortCol) {
		if (sortCol == null) {
			sortCol = "ProductId";
		}
		String fullQualifiedName = queryRequest.getEntityMetadata().getNamespace()+"."+queryRequest.getEntityMetadata().getName();
		CDSDataSourceHandler dsHandler = DataSourceHandlerFactory.getInstance().getCDSHandler(getConnection(), queryRequest.getEntityMetadata().getNamespace());
		try {
			CDSQuery cdsQuery = new CDSSelectQueryBuilder(fullQualifiedName).orderBy(sortCol, false).build();
			CDSSelectQueryResult cdsSelectQueryResult = dsHandler.executeQuery(cdsQuery);
			return cdsSelectQueryResult.getResult();
		} catch (CDSException e) {
			logger.error("==> Exception while fetching query data from CDS: " + e.getMessage());
			e.printStackTrace();
		}
		return null;
	}

	@Query(entity = "SalesOrders", serviceName = "ESPMService")
	public QueryResponse getAllSalesOrders(QueryRequest queryRequest) {
		QueryResponse queryResponse =  QueryResponse.setSuccess().setEntityData(getEntitySet(queryRequest, "SalesOrderId")).response();
		return queryResponse;
	}
	
	@Query(entity = "SalesOrderItems", serviceName = "ESPMService")
	public QueryResponse getAllSOItems(QueryRequest queryRequest) {
		QueryResponse queryResponse =  QueryResponse.setSuccess().setEntityData(getEntitySet(queryRequest, "SalesOrderId")).response();
		return queryResponse;
	}
	
	@Query(entity = "Customers", serviceName = "ESPMService")
	public QueryResponse getAllCustomers(QueryRequest queryRequest) {
		QueryResponse queryResponse =  QueryResponse.setSuccess().setEntityData(getEntitySet(queryRequest, "CustomerId")).response();
		return queryResponse;
	}
	
	@Query(entity = "Products", serviceName = "ESPMService")
	public QueryResponse getAllProducts(QueryRequest queryRequest) {
		QueryResponse queryResponse =  QueryResponse.setSuccess().setEntityData(getEntitySet(queryRequest, "ProductId")).response();
		return queryResponse;
	}
	
	@Query(entity = "Suppliers", serviceName = "ESPMService")
	public QueryResponse getAllSuppliers(QueryRequest queryRequest) {
		QueryResponse queryResponse =  QueryResponse.setSuccess().setEntityData(getEntitySet(queryRequest, "SupplierId")).response();
		return queryResponse;
	}
	
	@Query(entity = "Reviews", serviceName = "ESPMService")
	public QueryResponse getAllReviews(QueryRequest queryRequest) {
		QueryResponse queryResponse =  QueryResponse.setSuccess().setEntityData(getEntitySet(queryRequest, "CustomerReviewId")).response();
		return queryResponse;
	}
	
	@Query(entity = "Stocks", serviceName = "ESPMService")
	public QueryResponse getAllStocks(QueryRequest queryRequest) {
		QueryResponse queryResponse =  QueryResponse.setSuccess().setEntityData(getEntitySet(queryRequest, "ProductId")).response();
		return queryResponse;
	}
	
	@Query(entity = "ProductCategories", serviceName = "ESPMService")
	public QueryResponse getAllProductCategories(QueryRequest queryRequest) {
		QueryResponse queryResponse =  QueryResponse.setSuccess().setEntityData(getEntitySet(queryRequest, "Category")).response();
		return queryResponse;
	}
	
	@Query(entity = "ProductTexts", serviceName = "ESPMService")
	public QueryResponse getAllProductTexts(QueryRequest queryRequest) {
		QueryResponse queryResponse =  QueryResponse.setSuccess().setEntityData(getEntitySet(queryRequest, "Id")).response();
		return queryResponse;
	}


}