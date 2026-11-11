using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Threading.RateLimiting;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using BuildXP.API;
using BuildXP.API.Data;
using BuildXP.API.Repositories;
using BuildXP.API.Services;

var builder = WebApplication.CreateBuilder(args);
var jwtChave = JwtChave.Exigir(builder.Configuration["Jwt:Chave"]);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(BancoNaSubida.ParaEf(connectionString, builder.Environment.IsDevelopment())));

builder.Services.AddScoped<FeedbackService>();
builder.Services.AddScoped<CardService>();
builder.Services.AddSingleton<CatalogoEstatico>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ColaboradorService>();
builder.Services.AddScoped<FaixaColaboradorService>();
builder.Services.AddScoped<CardReadmeShareService>();
builder.Services.AddScoped<PerfilService>();
builder.Services.AddScoped<MarkdownBuilderService>();
builder.Services.AddScoped<ITerminalQuestaoRepository, TerminalQuestaoRepository>();
builder.Services.AddScoped<TerminalQuestaoService>();
builder.Services.AddScoped<TerminalMentorService>();
builder.Services.AddHttpClient(GroqChatClient.HttpClientName, client =>
{
    client.Timeout = TimeSpan.FromSeconds(45);
});
builder.Services.AddScoped<GroqChatClient>();
builder.Services.AddScoped<ConhecimentoChatService>();
builder.Services.AddScoped<RotinaService>();
builder.Services.AddScoped<SimulacaoService>();
builder.Services.AddScoped<EmailService>();

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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtChave))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "http://127.0.0.1:5500",
                "http://localhost:5500",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5021",
                "http://127.0.0.1:5021")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        o.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: true));
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json; charset=utf-8";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { mensagem = "Muitas perguntas em pouco tempo. Espere um instante e tente de novo." },
            token);
    };
    static RateLimitPartition<string> ParticaoIaPorIp(HttpContext httpContext) =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            });

    options.AddPolicy("feedback-publico", ParticaoIaPorIp);
    options.AddPolicy("conhecimento-chat", ParticaoIaPorIp);
    options.AddPolicy("ia-anonima", ParticaoIaPorIp);
    options.AddPolicy("readme-share-publico", ParticaoIaPorIp);
});

var app = builder.Build();

if (!BancoNaSubida.DevePreparar(connectionString))
{
    if (!BancoNaSubida.TemConnectionString(connectionString))
    {
        app.Logger.LogWarning(
            "ConnectionStrings:DefaultConnection vazia. Site estático, /health, Groq e o catálogo público de cards sobem; dashboard e terminal ainda precisam do banco.");
    }
}

await BancoNaSubida.PrepararAsync(app.Services, connectionString, app.Environment.WebRootPath);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", (IConfiguration config, IHostEnvironment env) =>
{
    var temBanco = BancoNaSubida.TemConnectionString(config.GetConnectionString("DefaultConnection"));
    return Results.Ok(new
    {
        status = temBanco ? "ok" : "degradado",
        ambiente = env.EnvironmentName,
        bancoConfigurado = temBanco,
        groqConfigurada = GroqChave.EstaConfigurada(config),
    });
});
app.MapControllers();
app.Run();

public partial class Program;
