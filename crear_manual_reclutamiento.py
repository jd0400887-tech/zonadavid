from fpdf import FPDF

class ManualPremium(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 8)
        self.set_text_color(150, 150, 150)
        if self.page_no() > 1:
            self.cell(0, 10, 'GUIA DE MODULO RECLUTAMIENTO', 0, 1, 'R')
            self.set_draw_color(255, 87, 34)
            self.line(10, 18, 200, 18)
            self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Pagina {self.page_no()}', 0, 0, 'C')

    def main_title(self, text):
        self.set_font('Arial', 'B', 24)
        self.set_text_color(30, 41, 59)
        self.cell(0, 20, text, 0, 1, 'L')
        self.set_draw_color(255, 87, 34)
        self.set_line_width(1)
        self.line(10, 35, 60, 35)
        self.ln(15)

    def section_title(self, text):
        self.ln(5)
        self.set_font('Arial', 'B', 14)
        self.set_text_color(255, 87, 34)
        self.cell(0, 10, text, 0, 1, 'L')
        self.ln(2)

    def body_text(self, text, bold=False):
        self.set_font('Arial', 'B' if bold else '', 11)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 7, text)
        self.ln(2)

    def bullet_point(self, title, description):
        self.set_font('Arial', 'B', 11)
        self.set_text_color(30, 41, 59)
        self.cell(10, 7, chr(149), 0, 0, 'C')
        self.cell(40, 7, f'{title}: ', 0, 0, 'L')
        self.set_font('Arial', '', 11)
        self.set_text_color(70, 70, 70)
        self.multi_cell(0, 7, description)

def crear_manual():
    pdf = ManualPremium()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # Portada / Titulo Principal
    pdf.main_title('GUIA DE MODULO\nRECLUTAMIENTO')
    
    pdf.body_text('Esta guia proporciona las instrucciones detalladas para la operacion del sistema de reclutamiento, asegurando una gestion eficiente de vacantes y candidatos en tiempo real.')

    # Seccion 1
    pdf.section_title('1. EL DASHBOARD DE CONTROL')
    pdf.body_text('Es la pantalla principal que ofrece una vision global del estado de las solicitudes. Los datos se actualizan automaticamente para reflejar cambios inmediatos.')
    
    pdf.bullet_point('Solicitudes Activas', 'Muestra el volumen total de trabajo actual (solicitudes no archivadas).')
    pdf.bullet_point('Sin Gestionar', 'Indica pedidos nuevos que aun no tienen candidatos asignados.')
    pdf.bullet_point('Inician Hoy/Manana', 'Alertas criticas de solicitudes cuya fecha de presentacion es inminente.')
    pdf.bullet_point('% Cobertura', 'Representa el exito del departamento. Mide cuantas vacantes activas han sido cubiertas satisfactoriamente.')

    # Seccion 2
    pdf.section_title('2. FILTRADO POR ZONA')
    pdf.body_text('Ubicado en la parte superior derecha, el "Switcher de Zonas" permite segmentar la informacion para un enfoque regional preciso:')
    pdf.bullet_point('Todas', 'Vista general de toda la operacion.')
    pdf.bullet_point('Zonas Especificas', 'Al seleccionar Centro, Norte o Noroeste, todos los KPIs y graficos se recalculan para mostrar solo los hoteles de esa area.')

    # Seccion 3
    pdf.add_page()
    pdf.section_title('3. GESTION DE SOLICITUDES (KANBAN)')
    pdf.body_text('El tablero Kanban organiza el flujo de trabajo mediante columnas de estado. El objetivo es mover las tarjetas de izquierda a derecha conforme avanza el reclutamiento.')
    
    pdf.bullet_point('Proceso Operativo', 'Las tarjetas deben transitar por: Pendiente > Enviada > En Proceso > Completada.')
    pdf.bullet_point('Urgencias', 'La barra de color en la tarjeta indica el tiempo transcurrido (Meta 72h). El color rojo señala una prioridad maxima.')
    pdf.bullet_point('Nueva Solicitud', 'Al crear una solicitud, es fundamental definir el hotel, el cargo (ej. Housekeeper) y la fecha exacta de inicio.')

    # Seccion 4
    pdf.section_title('4. ASIGNACION DE PERSONAL')
    pdf.body_text('Dentro de cada tarjeta se gestiona la lista de candidatos. El sistema permite vincular personal existente o registrar nuevos ingresos.')
    
    pdf.bullet_point('Estatus de Candidato', 'Es obligatorio actualizar el estado de cada persona asignada:')
    pdf.body_text('  - CONFIRMADO: El candidato ha aceptado la vacante.')
    pdf.body_text('  - LLEGÓ: El hotel valida la presencia del personal (Sube el % de cobertura).')
    pdf.body_text('  - NO LLEGÓ: Indica una falta, permitiendo buscar un reemplazo rapido.')

    # Seccion 5
    pdf.section_title('5. PROTOCOLO DE ARCHIVO')
    pdf.body_text('Para mantener la eficiencia visual, las solicitudes terminadas (Completadas, Canceladas o Vencidas) deben ser archivadas mediante el icono de la caja.')
    
    pdf.ln(20)
    pdf.set_font('Arial', 'B', 10)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 10, 'DOCUMENTO OFICIAL DE OPERACIONES - 2026', 0, 1, 'C')

    pdf.output('GUIA_MODULO_RECLUTAMIENTO.pdf')
    print("Nuevo Manual Premium Generado.")

if __name__ == "__main__":
    crear_manual()
