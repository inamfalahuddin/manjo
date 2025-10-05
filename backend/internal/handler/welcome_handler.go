package handler

import (
	"github.com/gofiber/fiber/v2"
)

func WelcomeHandler(c *fiber.Ctx) error {
	html := `
		<!DOCTYPE html>
		<html lang="id">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>QR Payment API</title>
			<style>
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}
				
				body {
					font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					min-height: 100vh;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 20px;
				}
				
				.container {
					background: white;
					border-radius: 15px;
					padding: 40px;
					box-shadow: 0 20px 40px rgba(0,0,0,0.1);
					max-width: 800px;
					width: 100%;
					text-align: center;
				}
				
				.logo {
					font-size: 3rem;
					margin-bottom: 20px;
				}
				
				h1 {
					color: #333;
					margin-bottom: 20px;
					font-size: 2.5rem;
				}
				
				.subtitle {
					color: #666;
					font-size: 1.2rem;
					margin-bottom: 30px;
					line-height: 1.6;
				}
				
				.status {
					background: #f8f9fa;
					border-radius: 10px;
					padding: 20px;
					margin: 30px 0;
					border-left: 4px solid #28a745;
				}
				
				.status h3 {
					color: #28a745;
					margin-bottom: 10px;
				}
				
				.links {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
					gap: 15px;
					margin: 30px 0;
				}
				
				.link-card {
					background: #f8f9fa;
					padding: 20px;
					border-radius: 10px;
					text-decoration: none;
					color: #333;
					transition: all 0.3s ease;
					border: 2px solid transparent;
				}
				
				.link-card:hover {
					background: #e9ecef;
					border-color: #667eea;
					transform: translateY(-2px);
				}
				
				.link-card h4 {
					margin-bottom: 10px;
					color: #495057;
				}
				
				.link-card p {
					color: #6c757d;
					font-size: 0.9rem;
				}
				
				.tech-stack {
					margin-top: 30px;
					padding-top: 20px;
					border-top: 1px solid #dee2e6;
				}
				
				.tech-stack h3 {
					margin-bottom: 15px;
					color: #495057;
				}
				
				.tech-tags {
					display: flex;
					flex-wrap: wrap;
					gap: 10px;
					justify-content: center;
				}
				
				.tech-tag {
					background: #667eea;
					color: white;
					padding: 5px 15px;
					border-radius: 20px;
					font-size: 0.8rem;
					font-weight: 500;
				}
				
				@media (max-width: 768px) {
					.container {
						padding: 20px;
					}
					
					h1 {
						font-size: 2rem;
					}
					
					.links {
						grid-template-columns: 1fr;
					}
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="logo">💰</div>
				<h1>QR Payment API</h1>
				<p class="subtitle">
					Layanan API untuk pembuatan QR Code pembayaran dan processing callback. 
					Sistem yang aman dan terintegrasi untuk transaksi digital.
				</p>
				
				<div class="status">
					<h3>✅ Sistem Berjalan dengan Baik</h3>
					<p>Server aktif dan siap menerima request</p>
				</div>
				
				<div class="links">
					<a href="/docs/" class="link-card">
						<h4>📚 API Documentation</h4>
						<p>Dokumentasi lengkap Swagger untuk semua endpoint API</p>
					</a>
					
					<a href="/api/v1/qr/generate" class="link-card">
						<h4>🔷 Generate QR</h4>
						<p>Endpoint untuk membuat QR Code pembayaran</p>
					</a>
					
					<a href="/api/v1/qr/payment" class="link-card">
						<h4>🔄 Payment Callback</h4>
						<p>Endpoint untuk processing callback pembayaran</p>
					</a>
				</div>
				
				<div class="tech-stack">
					<h3>Technology Stack</h3>
					<div class="tech-tags">
						<span class="tech-tag">Golang</span>
						<span class="tech-tag">Fiber</span>
						<span class="tech-tag">PostgreSQL</span>
						<span class="tech-tag">Docker</span>
						<span class="tech-tag">HMAC Auth</span>
						<span class="tech-tag">Swagger</span>
					</div>
				</div>
			</div>
		</body>
		</html>
	`

	c.Set("Content-Type", "text/html")
	return c.SendString(html)
}
