import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Clock, 
  Globe, 
  BarChart3, 
  QrCode, 
  Sparkles,
  Check,
  Hotel,
  Users,
  TrendingUp,
  Shield,
  Zap,
  MapPin,
  Calendar,
  Send
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { LanguageSelector } from "@/components/LanguageSelector";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

export default function LandingPage() {
  const { t } = useTranslation();
  const [demoForm, setDemoForm] = useState({
    name: "",
    email: "",
    hotelName: "",
    rooms: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.email || !demoForm.hotelName) {
      toast.error(t("landing.cta.fillRequired"));
      return;
    }

    setIsSubmitting(true);
    
    try {
      await api.post("/api/admin/demo-request", {
        name: demoForm.name,
        email: demoForm.email,
        hotelName: demoForm.hotelName,
        rooms: demoForm.rooms,
        message: demoForm.message,
      });

      toast.success(t("landing.cta.successTitle"), {
        description: t("landing.cta.successMessage")
      });
      
      setDemoForm({ name: "", email: "", hotelName: "", rooms: "", message: "" });
    } catch (error) {
      console.error("Error submitting demo request:", error);
      toast.error(t("landing.cta.errorMessage"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: MessageSquare,
      titleKey: "landing.features.aiConcierge.title",
      descriptionKey: "landing.features.aiConcierge.description"
    },
    {
      icon: Globe,
      titleKey: "landing.features.multilingual.title",
      descriptionKey: "landing.features.multilingual.description"
    },
    {
      icon: QrCode,
      titleKey: "landing.features.qrCode.title",
      descriptionKey: "landing.features.qrCode.description"
    },
    {
      icon: Calendar,
      titleKey: "landing.features.itinerary.title",
      descriptionKey: "landing.features.itinerary.description"
    },
    {
      icon: MapPin,
      titleKey: "landing.features.localGuide.title",
      descriptionKey: "landing.features.localGuide.description"
    },
    {
      icon: Zap,
      titleKey: "landing.features.instantRequests.title",
      descriptionKey: "landing.features.instantRequests.description"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      metricKey: "landing.benefits.lessCalls.metric",
      titleKey: "landing.benefits.lessCalls.title",
      descriptionKey: "landing.benefits.lessCalls.description"
    },
    {
      icon: Users,
      metricKey: "landing.benefits.availability.metric",
      titleKey: "landing.benefits.availability.title",
      descriptionKey: "landing.benefits.availability.description"
    },
    {
      icon: TrendingUp,
      metricKey: "landing.benefits.satisfaction.metric",
      titleKey: "landing.benefits.satisfaction.title",
      descriptionKey: "landing.benefits.satisfaction.description"
    },
    {
      icon: BarChart3,
      metricKey: "landing.benefits.data.metric",
      titleKey: "landing.benefits.data.title",
      descriptionKey: "landing.benefits.data.description"
    }
  ];

  const steps = [
    {
      step: "1",
      titleKey: "landing.howItWorks.step1.title",
      descriptionKey: "landing.howItWorks.step1.description"
    },
    {
      step: "2",
      titleKey: "landing.howItWorks.step2.title",
      descriptionKey: "landing.howItWorks.step2.description"
    },
    {
      step: "3",
      titleKey: "landing.howItWorks.step3.title",
      descriptionKey: "landing.howItWorks.step3.description"
    },
    {
      step: "4",
      titleKey: "landing.howItWorks.step4.title",
      descriptionKey: "landing.howItWorks.step4.description"
    }
  ];

  const demoActions = [
    "landing.demo.actions.extraTowels",
    "landing.demo.actions.lateCheckout",
    "landing.demo.actions.bookTaxi",
    "landing.demo.actions.viewMenu",
    "landing.demo.actions.discoverBeaches",
    "landing.demo.actions.createItinerary",
    "landing.demo.actions.breakfastHours",
    "landing.demo.actions.roomService"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Hotel className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">HotelConcierge.ai</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.nav.features")}
            </a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.nav.benefits")}
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.nav.howItWorks")}
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.nav.pricing")}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link to="/login">
              <Button variant="ghost" size="sm">{t("landing.nav.login")}</Button>
            </Link>
            <a href="#contact">
              <Button size="sm">{t("landing.nav.startFree")}</Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              {t("landing.hero.badge")}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
              {t("landing.hero.title")}
              <span className="text-primary"> {t("landing.hero.titleHighlight")}</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landing.hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="#contact">
                <Button size="lg" className="text-lg px-8">
                  {t("landing.hero.cta")}
                </Button>
              </a>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  {t("landing.hero.ctaSecondary")}
                </Button>
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              {t("landing.hero.setupInfo")}
            </p>
          </div>

          {/* Hero Image/Demo */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 border">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Phone Mockup */}
                <div className="flex justify-center">
                  <div className="w-64 bg-background rounded-3xl border-4 border-foreground/10 p-2 shadow-2xl">
                    <div className="bg-muted rounded-2xl h-[500px] flex flex-col">
                      <div className="p-4 border-b bg-primary/10 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Hotel className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{t("landing.demo.hotelName")}</p>
                            <p className="text-xs text-muted-foreground">{t("landing.demo.room")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-4 space-y-3 overflow-hidden">
                        <div className="bg-primary/10 rounded-2xl rounded-tl-none p-3 text-sm max-w-[85%]">
                          {t("landing.demo.welcomeMsg")}
                        </div>
                        <div className="bg-foreground/10 rounded-2xl rounded-tr-none p-3 text-sm max-w-[85%] ml-auto">
                          {t("landing.demo.guestQuestion")}
                        </div>
                        <div 
                          className="bg-primary/10 rounded-2xl rounded-tl-none p-3 text-sm max-w-[85%]"
                          dangerouslySetInnerHTML={{ __html: t("landing.demo.assistantAnswer") }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features Preview */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">{t("landing.demo.whatGuestsCanDo")}</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {demoActions.map((actionKey, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{t(actionKey)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">
            {t("landing.socialProof")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50">
            {["Hotel Paraíso", "Pousada das Flores", "Resort Atlântico", "Hotel Business Center", "Boutique Charme"].map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <Hotel className="w-5 h-5" />
                <span className="font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("landing.features.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.features.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-muted-foreground">{t(feature.descriptionKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("landing.benefits.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.benefits.subtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">{t(benefit.metricKey)}</div>
                  <h3 className="font-semibold mb-1">{t(benefit.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(benefit.descriptionKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("landing.howItWorks.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.howItWorks.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 relative z-10">
                    {step.step}
                  </div>
                  <h3 className="font-semibold mb-2">{t(step.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(step.descriptionKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("landing.pricing.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.pricing.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{t("landing.pricing.starter.name")}</h3>
                  <p className="text-sm text-muted-foreground">{t("landing.pricing.starter.description")}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$197</span>
                  <span className="text-muted-foreground">{t("landing.pricing.perMonth")}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {(t("landing.pricing.starter.features", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="outline">{t("landing.pricing.startFree")}</Button>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                {t("landing.pricing.mostPopular")}
              </div>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{t("landing.pricing.professional.name")}</h3>
                  <p className="text-sm text-muted-foreground">{t("landing.pricing.professional.description")}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$497</span>
                  <span className="text-muted-foreground">{t("landing.pricing.perMonth")}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {(t("landing.pricing.professional.features", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full">{t("landing.pricing.startFree")}</Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{t("landing.pricing.enterprise.name")}</h3>
                  <p className="text-sm text-muted-foreground">{t("landing.pricing.enterprise.description")}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {(t("landing.pricing.enterprise.features", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="outline">{t("landing.pricing.contactSales")}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">{t("landing.security.title")}</h2>
              <p className="text-muted-foreground mb-4">
                {t("landing.security.description")}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1"><Check className="w-4 h-4 text-primary" /> {t("landing.security.lgpd")}</span>
                <span className="flex items-center gap-1"><Check className="w-4 h-4 text-primary" /> {t("landing.security.encryption")}</span>
                <span className="flex items-center gap-1"><Check className="w-4 h-4 text-primary" /> {t("landing.security.servers")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Demo Form */}
      <section id="contact" className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("landing.cta.title")}
              </h2>
              <p className="text-lg opacity-90 mb-6">
                {t("landing.cta.subtitle")}
              </p>
              <ul className="space-y-3 opacity-90">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5" /> {t("landing.cta.benefit1")}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5" /> {t("landing.cta.benefit2")}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5" /> {t("landing.cta.benefit3")}
                </li>
              </ul>
            </div>
            
            <Card className="bg-background text-foreground">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">{t("landing.cta.formTitle")}</h3>
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="demo-name">{t("landing.cta.yourName")}</Label>
                      <Input
                        id="demo-name"
                        placeholder="João Silva"
                        value={demoForm.name}
                        onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="demo-email">{t("landing.cta.email")}</Label>
                      <Input
                        id="demo-email"
                        type="email"
                        placeholder="joao@hotel.com"
                        value={demoForm.email}
                        onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="demo-hotel">{t("landing.cta.hotelName")}</Label>
                      <Input
                        id="demo-hotel"
                        placeholder="Hotel Paraíso"
                        value={demoForm.hotelName}
                        onChange={(e) => setDemoForm({ ...demoForm, hotelName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="demo-rooms">{t("landing.cta.numberOfRooms")}</Label>
                      <Input
                        id="demo-rooms"
                        type="number"
                        placeholder="50"
                        value={demoForm.rooms}
                        onChange={(e) => setDemoForm({ ...demoForm, rooms: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-message">{t("landing.cta.message")}</Label>
                    <Textarea
                      id="demo-message"
                      placeholder={t("landing.cta.messagePlaceholder")}
                      value={demoForm.message}
                      onChange={(e) => setDemoForm({ ...demoForm, message: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? t("landing.cta.submitting") : t("landing.cta.submit")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-semibold">HotelConcierge.ai</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("landing.footer.tagline")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("landing.footer.product")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">{t("landing.footer.features")}</a></li>
                <li><a href="#pricing" className="hover:text-foreground">{t("landing.footer.pricing")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("landing.footer.integrations")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("landing.footer.api")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("landing.footer.company")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">{t("landing.footer.about")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("landing.footer.blog")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("landing.footer.careers")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("landing.footer.contact")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("landing.footer.legal")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">{t("landing.footer.terms")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("landing.footer.privacy")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("landing.footer.lgpd")}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            {t("landing.footer.copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}
