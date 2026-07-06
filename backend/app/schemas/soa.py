from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Literal

from pydantic import BaseModel, Field


# ============================================================================
# SCHEMAS DE RESPONSE - CONTROL INDIVIDUAL
# ============================================================================

class SOAControlStatusOut(BaseModel):
    """Schema de response para un control SOA individual.
    
    Incluye datos de SOAControlStatus + AssessmentQuestion + categoría derivada.
    Cuando el control nunca ha sido editado, no existe fila en soa_control_status:
    en ese caso, id, created_at, updated_at son None y otros campos tienen defaults.
    """
    # Campos de SOAControlStatus - OPCIONALES para controles sin fila aún
    id: UUID | None = Field(default=None, description="None si el control nunca fue editado")
    organization_id: UUID | None = Field(default=None, description="None si el control nunca fue editado")
    question_id: UUID
    applicable: bool = Field(default=True, description="True si el control es aplicable")
    implementation_status: Literal["no_implementado", "parcial", "implementado"] = Field(
        default="no_implementado"
    )
    exclusion_justification: str | None = None
    policy_reference: str | None = None
    created_at: datetime | None = Field(default=None, description="None si aún no hay fila")
    updated_at: datetime | None = Field(default=None, description="None si aún no hay fila")
    
    # Campos de AssessmentQuestion (joined)
    clause_ref: str
    text: str
    is_critical: bool
    
    # Categoría derivada (A.5, A.6, A.7, A.8)
    category: str = Field(description="Categoría ISO 27001 derivada de clause_ref (ej: A.5)")
    
    model_config = {"from_attributes": True}


class SOAControlListOut(BaseModel):
    """Response de listado de controles SOA con paginación."""
    total: int = Field(description="Total de controles devueltos")
    controls: list[SOAControlStatusOut] = Field(description="Lista de controles SOA")


# ============================================================================
# SCHEMAS DE REQUEST - PATCHES
# ============================================================================

class SOAApplicabilityRequest(BaseModel):
    """Request para PATCH /soa/controls/:id/applicability — toggle aplicable."""
    applicable: bool = Field(description="Si el control es aplicable a la organización")


class SOAImplementationStatusRequest(BaseModel):
    """Request para PATCH /soa/controls/:id/status — actualizar estado."""
    implementation_status: Literal["no_implementado", "parcial", "implementado"] = Field(
        description="Estado de implementación del control"
    )


class SOAExclusionRequest(BaseModel):
    """Request para PATCH /soa/controls/:id/exclusion — justificación + referencia de política."""
    exclusion_justification: str | None = Field(
        default=None, 
        max_length=2000,
        description="Justificación si el control no es aplicable (max 2000 caracteres)"
    )
    policy_reference: str | None = Field(
        default=None,
        max_length=2000,
        description="Referencia a la política que reemplaza este control (max 2000 caracteres)"
    )


# ============================================================================
# SCHEMAS DE RESPONSE - SUMMARY/ESTADÍSTICAS
# ============================================================================

class CategoryBreakdown(BaseModel):
    """Breakdown de controles por categoría (A.5, A.6, A.7, A.8)."""
    category: str = Field(description="Categoría ISO 27001 (A.5, A.6, A.7, A.8)")
    total: int = Field(description="Total de controles en esta categoría")
    applicable: int = Field(description="Controles aplicables")
    non_applicable: int = Field(description="Controles no aplicables")
    implemented: int = Field(description="Controles implementados")
    partial: int = Field(description="Controles parcialmente implementados")
    not_implemented: int = Field(description="Controles no implementados")
    coverage_percentage: float = Field(
        description="Porcentaje de cobertura (implementados + parciales / aplicables)"
    )


class SOASummaryOut(BaseModel):
    """Response de resumen/estadísticas SOA."""
    # Totales globales
    total_controls: int = Field(description="Total de 93 controles del Anexo A")
    total_applicable: int = Field(description="Controles aplicables")
    total_non_applicable: int = Field(description="Controles no aplicables")
    
    # Por estado de implementación (solo contando los aplicables)
    implemented: int = Field(description="Controles implementados (solo aplicables)")
    partial: int = Field(description="Controles parcialmente implementados (solo aplicables)")
    not_implemented: int = Field(description="Controles no implementados (solo aplicables)")
    
    # Porcentaje de cobertura
    coverage_percentage: float = Field(
        description="Porcentaje de cobertura: (implemented + partial) / total_applicable * 100"
    )
    
    # Breakdown por categoría
    breakdown_by_category: list[CategoryBreakdown] = Field(
        description="Desglose de controles por categoría ISO 27001"
    )
