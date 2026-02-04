export interface PrintableTicket {
    ticketNumber: string;
    licensePlate: string;
    driverName: string;
    companyName?: string;
    loadedProducts?: any[];
    qrCode?: string;
    arrivedAt: string | Date;
    zone?: string;
    status: string;
    department?: string;
    orderNumber?: string;
    site?: { name: string };
    company?: { name: string };
    customerName?: string;
}

export const printTicket = (ticket: PrintableTicket) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) {
        alert("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.");
        return;
    }

    const productsList = Array.isArray(ticket.loadedProducts)
        ? ticket.loadedProducts.map((p: any) => p.designation || p.name || p).join(', ')
        : 'Chargement divers';

    const date = new Date(ticket.arrivedAt).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Ticket ${ticket.ticketNumber}</title>
        <style>
            @page {
                size: 80mm auto;
                margin: 0;
            }
            body {
                font-family: 'Courier New', Courier, monospace;
                width: 78mm;
                margin: 0 auto;
                padding: 10px 5px;
                color: #000;
                background: #fff;
            }
            .header {
                text-align: center;
                border-bottom: 2px dashed #000;
                padding-bottom: 10px;
                margin-bottom: 10px;
            }
            .title {
                font-size: 18px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .subtitle {
                font-size: 12px;
                margin-top: 5px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .label {
                font-weight: bold;
            }
            .content {
                text-align: right;
                max-width: 60%;
                word-wrap: break-word;
            }
            .products {
                margin: 10px 0;
                border-top: 1px dotted #000;
                border-bottom: 1px dotted #000;
                padding: 5px 0;
                font-size: 14px;
            }
            .qr-code {
                text-align: center;
                margin: 15px 0;
            }
            .qr-code img {
                width: 150px;
                height: 150px;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                margin-top: 15px;
                border-top: 1px dashed #000;
                padding-top: 5px;
            }
            .big-number {
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">${ticket.company?.name || 'SIBM'}</div>
            <div class="subtitle">${ticket.site?.name || 'SITE EXPLOITATION'}</div>
            <div class="subtitle">Ticket d'Entrée - ${date}</div>
        </div>

        <div class="big-number">${ticket.ticketNumber}</div>

        <div class="info-details">
            <div class="info-row">
                <span class="label">Plaque:</span>
                <span class="content">${ticket.licensePlate}</span>
            </div>
            <div class="info-row">
                <span class="label">Chauffeur:</span>
                <span class="content">${ticket.driverName.substring(0, 18)}</span>
            </div>
            ${ticket.customerName || ticket.companyName ? `
            <div class="info-row">
                <span class="label">Client:</span>
                <span class="content">${(ticket.customerName || ticket.companyName || '').substring(0, 25)}</span>
            </div>
            ` : ''}
            ${ticket.zone ? `
            <div class="info-row">
                <span class="label">Zone:</span>
                <span class="content">${ticket.zone}</span>
            </div>
            ` : ''}
            ${ticket.department ? `
            <div class="info-row">
                <span class="label">Poste:</span>
                <span class="content">${ticket.department}</span>
            </div>
            ` : ''}
            ${ticket.orderNumber ? `
            <div class="info-row">
                <span class="label">Commande:</span>
                <span class="content">${ticket.orderNumber}</span>
            </div>
            ` : ''}
        </div>

        <div class="products">
            <div class="label" style="margin-bottom: 2px;">Produits:</div>
            <div>${productsList}</div>
        </div>

        ${ticket.qrCode ? `
        <div class="qr-code">
            <img src="${ticket.qrCode}" alt="QR Code" />
        </div>
        ` : ''}

        <div class="footer">
            <p>Merci de conserver ce ticket<br/>jusqu'à la sortie.</p>
            <p>Bonne journée !</p>
        </div>

        <script>
            window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
            }
        </script>
    </body>
    </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
