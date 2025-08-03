// Department and Role Configuration
// Each category/subcategory lists its allowed roles and constraints

export const departmentRoles = {
  "Director General": [
    { role: "director_general", label: "Director General", max: 1 },
    { role: "deputy_director_general", label: "Deputy Director General", max: 1 },
    { role: "executive_advisor", label: "Executive Advisor", max: 1 },
    { role: "director_office", label: "Director Office", max: null }
  ],
  "Public Relations Executive": [
    { role: "public_relations_executive_head", label: "Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Legal Services": [
    { role: "legal_services_executive_head", label: "Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Audit": [
    { role: "audit_executive_head", label: "Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Ethics & Anti-Corruption": [
    { role: "ethics_anti_corruption_executive_head", label: "Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Women & Social Inclusion": [
    { role: "women_social_inclusion_executive_head", label: "Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Strategic Affairs": [
    { role: "strategic_affairs_executive_head", label: "Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Information & Communication Technology": [
    { role: "information_communication_technology_executive_head", label: "Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Procurement & Finance": [
    { role: "procurement_finance_executive_head", label: "Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Human Resource Management": [
    { role: "human_resource_management_executive_head", label: "Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Institutional Transformation": [
    { role: "institutional_transformation_executive_head", label: "Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  // Space Sector Subcategories
  "Astronomy & Astrophysics": [
    { role: "astronomy_astrophysics_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Space & Planetary Science": [
    { role: "space_planetary_science_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Remote Sensing": [
    { role: "remote_sensing_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Geodesy & Geodynamics": [
    { role: "geodesy_geodynamics_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Aerospace Engineering": [
    { role: "aerospace_engineering_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Satellite Operation": [
    { role: "satellite_operation_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Postgraduate Registrar & Research Admin": [
    { role: "postgraduate_registrar_research_admin_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  // Geospatial Subcategories
  "Aerial Survey": [
    { role: "aerial_survey_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Photogrammetry & LiDAR Processing": [
    { role: "photogrammetry_lidar_processing_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Cartography": [
    { role: "cartography_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Geodetic Infrastructure Services": [
    { role: "geodetic_infrastructure_services_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Digital Image Processing": [
    { role: "digital_image_processing_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Spatial Planning & Decision Support": [
    { role: "spatial_planning_decision_support_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  // Technology & Policy Subcategories
  "Space Geospatial Standardization": [
    { role: "space_geospatial_standardization_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Platform & Application Development": [
    { role: "platform_application_development_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Data & System Administration": [
    { role: "data_system_administration_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Technology Transfer": [
    { role: "technology_transfer_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Space Geospatial Regional Connectivity": [
    { role: "space_geospatial_regional_connectivity_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ],
  "Policy & Legal Framework": [
    { role: "policy_legal_framework_lead_executive_head", label: "Lead Executive Head", max: 1 },
    { role: "director_office", label: "Director Office", max: null },
    { role: "user", label: "User", max: null }
  ]
}; 