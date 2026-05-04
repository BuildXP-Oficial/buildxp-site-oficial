using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BuildXP.API.Data;
using BuildXP.API.Services;
using Resend;

var builder = WebApplication.CreateBuilder(args);

// ── BANCO DE DADOS ───────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── SERVICES — injeção de dependência ───────────────────────
// registra os services para o .NET saber como criá-los
builder.Services.AddScoped<FeedbackService>();
builder.Services.AddScoped<CardService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ColaboradorService>();

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

// ── RESEND — e-mail (pacote Resend: HttpClient + IResend)
builder.Services.AddOptions();
builder.Services.AddHttpClient<ResendClient>();
builder.Services.Configure<ResendClientOptions>(o =>
{
    o.ApiToken = builder.Configuration["Resend:ApiKey"]!;
});
builder.Services.AddTransient<IResend, ResendClient>();
builder.Services.AddScoped<EmailService>();

// ── CORS — libera o frontend HTML ───────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "http://127.0.0.1:5500",
                "http://localhost:5500",
                "http://localhost:3000",
                "http://127.0.0.1:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // ← essencial para credentials: 'include' funcionar
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
app.UseDefaultFiles();           // 3. serve index.html e outros arquivos estáticos
app.UseStaticFiles();           // 4. serve arquivos estáticos (CSS, JS, imagens)
app.UseAuthentication();         // 3. verifica o token JWT
app.UseAuthorization();          // 4. verifica as permissões
app.MapControllers();            // 5. mapeia as rotas
app.Run();
