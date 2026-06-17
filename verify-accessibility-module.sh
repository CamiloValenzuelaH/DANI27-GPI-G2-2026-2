#!/usr/bin/env bash
# Verificación de Accesibilidad & Mobile Responsive Module
# Este script verifica que todos los archivos del módulo estén presentes

echo "🔍 Verificando Módulo de Accesibilidad..."
echo ""

BASE_PATH="frontend/src/accessibility"
MAIN_FILES=(
    "README.md"
    "ACCESSIBILITY.md"
    "WCAG_GUIDE.md"
    "RESPONSIVE_GUIDE.md"
    "INTEGRATION_GUIDE.md"
    "DEPENDENCIES.md"
    "index.ts"
)

COMPONENT_FILES=(
    "components/SkipToMainContent.tsx"
    "components/AccessibleModal.tsx"
    "components/AccessibleDropdown.tsx"
    "components/AccessibleTabs.tsx"
    "components/ResponsiveProvider.tsx"
    "components/examples.tsx"
)

HOOK_FILES=(
    "hooks/useA11y.ts"
)

UTIL_FILES=(
    "utils/a11y-helpers.ts"
)

AUDIT_FILES=(
    "audit/audit-report.ts"
)

TEST_FILES=(
    "tests/a11y-test-utils.ts"
)

CONFIG_FILES=(
    "config/tailwind-a11y.ts"
)

MAIN_DIR_FILES=(
    "ACCESSIBILITY_MODULE_SUMMARY.md"
    "ACCESSIBILITY_IMPLEMENTATION_PLAN.md"
    "ACCESSIBILITY_STEP_BY_STEP.md"
)

# Función para verificar archivo
verify_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
        return 0
    else
        echo "❌ $1 (FALTANTE)"
        return 1
    fi
}

# Función para verificar directorio
verify_dir() {
    if [ -d "$1" ]; then
        echo "✅ Directorio: $1"
        return 0
    else
        echo "❌ Directorio: $1 (FALTANTE)"
        return 1
    fi
}

# Contadores
TOTAL=0
FOUND=0

# Verificar directorios principales
echo "📁 Verificando Directorios..."
verify_dir "$BASE_PATH" && ((FOUND++)) || :
verify_dir "$BASE_PATH/components" && ((FOUND++)) || :
verify_dir "$BASE_PATH/hooks" && ((FOUND++)) || :
verify_dir "$BASE_PATH/utils" && ((FOUND++)) || :
verify_dir "$BASE_PATH/audit" && ((FOUND++)) || :
verify_dir "$BASE_PATH/tests" && ((FOUND++)) || :
verify_dir "$BASE_PATH/config" && ((FOUND++)) || :
echo ""

# Verificar archivos de documentación principal
echo "📄 Archivos de Documentación Principal..."
for file in "${MAIN_FILES[@]}"; do
    ((TOTAL++))
    verify_file "$BASE_PATH/$file" && ((FOUND++)) || :
done
echo ""

# Verificar componentes
echo "🎨 Componentes Accesibles..."
for file in "${COMPONENT_FILES[@]}"; do
    ((TOTAL++))
    verify_file "$BASE_PATH/$file" && ((FOUND++)) || :
done
echo ""

# Verificar hooks
echo "🪝 Hooks Personalizados..."
for file in "${HOOK_FILES[@]}"; do
    ((TOTAL++))
    verify_file "$BASE_PATH/$file" && ((FOUND++)) || :
done
echo ""

# Verificar utilities
echo "🛠️ Utilidades..."
for file in "${UTIL_FILES[@]}"; do
    ((TOTAL++))
    verify_file "$BASE_PATH/$file" && ((FOUND++)) || :
done
echo ""

# Verificar auditoría
echo "📊 Auditoría..."
for file in "${AUDIT_FILES[@]}"; do
    ((TOTAL++))
    verify_file "$BASE_PATH/$file" && ((FOUND++)) || :
done
echo ""

# Verificar testing
echo "🧪 Testing Utilities..."
for file in "${TEST_FILES[@]}"; do
    ((TOTAL++))
    verify_file "$BASE_PATH/$file" && ((FOUND++)) || :
done
echo ""

# Verificar configuración
echo "⚙️ Configuración..."
for file in "${CONFIG_FILES[@]}"; do
    ((TOTAL++))
    verify_file "$BASE_PATH/$file" && ((FOUND++)) || :
done
echo ""

# Verificar archivos en raíz del proyecto
echo "📋 Archivos en Raíz del Proyecto..."
for file in "${MAIN_DIR_FILES[@]}"; do
    ((TOTAL++))
    verify_file "$file" && ((FOUND++)) || :
done
echo ""

# Resumen
echo "════════════════════════════════════════════════════════════"
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "════════════════════════════════════════════════════════════"
echo "Total de archivos esperados: $TOTAL"
echo "Archivos encontrados: $FOUND"
PERCENTAGE=$((FOUND * 100 / TOTAL))
echo "Porcentaje de completitud: $PERCENTAGE%"
echo ""

if [ $FOUND -eq $TOTAL ]; then
    echo "🎉 ¡MÓDULO COMPLETO! Todos los archivos están presentes."
    echo ""
    echo "📖 Próximos pasos:"
    echo "1. Leer: ACCESSIBILITY_MODULE_SUMMARY.md"
    echo "2. Revisar: frontend/src/accessibility/README.md"
    echo "3. Seguir: ACCESSIBILITY_STEP_BY_STEP.md"
    echo "4. Implementar: ACCESSIBILITY_IMPLEMENTATION_PLAN.md"
    exit 0
else
    echo "⚠️ MÓDULO INCOMPLETO"
    echo "Faltan $((TOTAL - FOUND)) archivos."
    echo ""
    echo "Por favor, crear los archivos faltantes."
    exit 1
fi
