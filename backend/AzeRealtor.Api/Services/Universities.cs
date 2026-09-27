using AzeRealtor.Api.Models;

namespace AzeRealtor.Api.Services;

public static class Universities
{
    public static readonly IReadOnlyList<University> All =
    [
        new(1, "UNEC - Nizami korpusu", 40.3779, 49.8452),
        new(11, "UNEC - İçərişəhər korpusu", 40.3665, 49.8352),
        new(12, "UNEC - Gənclik korpusu", 40.4002, 49.8520),
        new(13, "UNEC - Semaşko korpusu", 40.3878, 49.8262),
        new(2, "BDU — Bakı Dövlət Universiteti", 40.3742, 49.8163),
        new(3, "ADNSU — Azərbaycan Dövlət Neft və Sənaye Un.", 40.3947, 49.8497),
        new(4, "ADA Universiteti", 40.3955, 49.8478),
        new(5, "AzTU — Azərbaycan Texniki Universiteti", 40.3835, 49.8035),
        new(6, "ADPU — Azərbaycan Dövlət Pedaqoji Un.", 40.3785, 49.8372),
        new(7, "Azərbaycan Tibb Universiteti", 40.3885, 49.8440),
        new(8, "Azərbaycan Dillər Universiteti", 40.3765, 49.8465),
        new(9, "Memarlıq və İnşaat Universiteti", 40.3961, 49.8180),
        new(10, "Bakı Slavyan Universiteti", 40.3795, 49.8420),
    ];
}
