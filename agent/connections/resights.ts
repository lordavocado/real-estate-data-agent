import { defineOpenAPIConnection } from "eve/connections";
import spec from "./resights-openapi.json";

export default defineOpenAPIConnection({
  spec: {
    ...spec,
    servers: [
      {
        url: process.env.RESIGHTS_API_DOMAIN || "https://api.dev.resights.dk",
      },
    ],
  },
  baseUrl: process.env.RESIGHTS_API_DOMAIN || "https://api.dev.resights.dk",
  description:
    "Resights API — Danish property and company data. Query properties (BFE), companies (CVR), persons (EJF), trades, investment transactions, rental data, GIS layers, municipal plans, energy labels, BBR buildings/units, land registry (tinglysning), POI, demographics (DST), and more. Supports Elasticsearch-style DSL queries for filtering and aggregations across 2,500+ variables from BBR, CVR, Tinglysningen, VUR, and Plandata.dk.",
  auth: {
    getToken: async () => ({
      token: process.env.RESIGHTS_API_TOKEN!,
    }),
  },
  operations: {
    allow: [
      // ── Properties ──────────────────────────────────────────
      "get_properties",
      "get_properties_advanced",
      "get_property_by_bfe_number",
      "get_property_details_overview",
      "get_property_details_bbr",
      "get_property_details_bbr_history",
      "get_property_details_tax",
      "get_property_details_old_tax",
      "get_property_details_ois_tax",
      "get_property_details_owners",
      "get_property_details_ebr",
      "get_property_timeline",
      "get_property_trades",
      "get_property_trades_latest",
      "get_property_valuations",
      "get_property_valuation_latest",
      "get_property_valuation_new",
      "get_avm_by_bfe_number",
      "get_property_indicators",
      "properties",

      // ── BBR ─────────────────────────────────────────────────
      "get_bbr_buildings",
      "get_bbr_units",
      "get_bbr_floors",
      "get_bbr_cases",
      "get_bbr_technical_installations",
      "bbr_buildings",
      "bbr_units",

      // ── Energy ──────────────────────────────────────────────
      "get_energy_label",
      "get_energy_label_by_id",
      "get_energy_from_bfe_number",
      "get_aggregated_energy_from_building_id",
      "get_aggregated_energy_from_unit_id",
      "get_energy_type_aggregations",

      // ── Companies (CVR) ─────────────────────────────────────
      "get_cvr_companies",
      "get_cvr_companies_advanced",
      "get_cvr_company",
      "get_company_financials",
      "get_company_financials_latest",
      "get_company_timeline",
      "get_company_trade",
      "get_cvr_members",
      "get_cvr_members_advanced",
      "get_cvr_member",
      "get_member_timeline",
      "get_cvr_p_units",
      "get_cvr_p_unit",
      "get_cvr_network",
      "expand_network",
      "get_connections_between_pair",
      "get_partners_in_crime",
      "cvr_companies",
      "cvr_p_units",

      // ── Persons (EJF) ───────────────────────────────────────
      "get_ejf_persons",
      "get_ejf_persons_advanced",
      "get_ejf_person_by_id",
      "get_ejf_person_portfolio_by_id",
      "get_pep_relations",
      "get_ejf_others",
      "get_ejf_others_advanced",
      "get_ejf_other_by_id",

      // ── Trades ──────────────────────────────────────────────
      "get_trades",
      "get_trades_advanced",
      "get_trade_by_id",
      "get_portfolio_trades",

      // ── Investment Transactions ─────────────────────────────
      "get_transactions_es",
      "get_transactions_advanced",
      "get_transaction_by_id",
      "get_transactions_latest",
      "get_transactions_stats",
      "get_transactions_pg",
      "transactions",

      // ── Listings ────────────────────────────────────────────
      "get_listings",
      "get_listings_advanced",
      "get_listings_timeline",
      "autocomplete_listings",

      // ── Rental ──────────────────────────────────────────────
      "get_rental_observations_v2",
      "search_rental_observations_v2_es",
      "query_rental_observations_v2",
      "get_rental_boxplot_v2",
      "get_rental_scatterplot_v2",
      "get_rental_metrics_v2",
      "get_rental_filters_v2",
      "rental_observation",

      // ── Multi-index ─────────────────────────────────────────
      "get_multi_index_search",
      "autocomplete_multisearch",

      // ── Cadastre ────────────────────────────────────────────
      "get_cadastres",
      "get_cadastres_advanced",
      "get_cadastre_by_id",

      // ── Tinglysning (Land Registry) ─────────────────────────
      "search_tinglysning_by_bfe_number",
      "search_tinglysning_by_address",
      "search_tinglysning_by_cadastre",
      "search_tinglysning_by_municipality",
      "get_atd_by_uuid",
      "get_atd_by_alias_id",
      "get_tingbogsattest_by_uuid",
      "get_andelsboligattest_by_uuid",
      "get_historic_claims_by_uuid",
      "search_company_documents",
      "search_company_registrations",
      "search_person_by_name",
      "search_person_by_cpr_number",
      "search_vehicle_by_id",
      "search_vehicle_by_person",
      "search_vehicle_by_cvr_number",
      "search_andelsbolig_by_address",
      "search_andelsbolig_by_cvr_number",

      // ── GIS ─────────────────────────────────────────────────
      "get_geojson_layer",
      "get_geojson_layer_metainformation",
      "get_vector_layer",
      "geom_features",
      "get_geodanmark_buildings",

      // ── Plandata ────────────────────────────────────────────
      "get_plandata",

      // ── Land Analysis ───────────────────────────────────────
      "get_land_analysis",
      "get_lbst_marker",
      "get_lbst_marker_by_cadastre",
      "get_lbst_marker_by_bfe_number_cadastres",

      // ── POI ─────────────────────────────────────────────────
      "get_poi_schools",
      "get_poi_daycare",
      "get_poi_public_transport",
      "get_poi_shop_brands",
      "get_poi_shop",
      "get_n_closest_pois",
      "get_pois_within_radius",
      "search_poi_shops",
      "search_poi_traffic",
      "search_poi_traffic_noise",

      // ── Financials ──────────────────────────────────────────
      "get_financials",
      "get_financials_advanced",
      "get_financials_by_id",

      // ── DST Demographics ────────────────────────────────────
      "dst_folk1a",
      "dst_frkm123",
      "dst_fly66",
      "dst_bil800",
      "dst_hfudd16",
      "dst_ligeab2",
      "dst_indkp222",
      "dst_udb030",

      // ── Development pipeline ────────────────────────────────
      "get_pre_projects_advanced",
      "get_pre_tenders_advanced",

      // ── Statstidende ────────────────────────────────────────
      "get_statstidende_messages",
      "get_statstidende_message_by_id",
      "get_statstidende_sections",

      // ── Minutes ─────────────────────────────────────────────
      "get_minutes_cases",
      "get_meeting",

      // ── Teledata ────────────────────────────────────────────
      "search_teledata",
      "get_teledata_by_person_id",
      "get_teledata_by_phone_number",
      "get_teledata_by_address_id",
      "what_where_teledata",

      // ── Export ──────────────────────────────────────────────
      "export_properties",
      "export_trades",
      "export_rental_v2",
      "export_companies",
      "export_financials",
      "export_tinglysning",

      // ── Isochrone ───────────────────────────────────────────
      "convert_geojson_to_travel_distance_duration",
      "convert_isochrone_to_geojson",
    ],
  },
});
