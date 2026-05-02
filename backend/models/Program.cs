using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BuildXP.API.Data;
using BuildXP.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ── BANCO DE DADOS ───────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── SERVICES — injeção de dependência ───────────────────────
// registra os services para o .NET saber como criá-los
builder.Services.AddScoped<FeedbackService>();
builder.Services.AddScoped<CardService>();
builder.Services.AddScoped<AuthService>();

// ── JWT — autenticação ───────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Chave"]!))
        };
    });

builder.Services.AddAuthorization();

// ── CORS — libera o frontend HTML ───────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "http://127.0.0.1:5500",  // Live Server do VS Code
                "http://localhost:5500")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ── CONTROLLERS & SWAGGER ────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ── ORDEM IMPORTA — middleware na sequência correta ─────────
app.UseCors("Frontend");         // 1. libera o frontend
app.UseHttpsRedirection();       // 2. redireciona para HTTPS
app.UseAuthentication();         // 3. verifica o token JWT
app.UseAuthorization();          // 4. verifica as permissões
app.MapControllers();            // 5. mapeia as rotas
app.Run();
