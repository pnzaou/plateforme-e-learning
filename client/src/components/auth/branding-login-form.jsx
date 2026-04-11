import { GraduationCap } from "lucide-react"

function BrandingLoginForm() {
  return (
    <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="relative z-10 text-center space-y-6 max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-heading font-bold text-white">
          ISI Learn
        </h1>
        <p className="text-lg text-white/80">
          Votre plateforme e-learning pour exceller dans vos études.
        </p>
        <div className="grid grid-cols-3 gap-4 pt-8">
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur">
            <p className="text-2xl font-bold text-white">500+</p>
            <p className="text-xs text-white/70">Étudiants</p>
          </div>
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur">
            <p className="text-2xl font-bold text-white">50+</p>
            <p className="text-xs text-white/70">Cours</p>
          </div>
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur">
            <p className="text-2xl font-bold text-white">30+</p>
            <p className="text-xs text-white/70">Enseignants</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandingLoginForm;
