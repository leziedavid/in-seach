'use client';

import { fakeUser } from "@/data/account.fake";



export default function AccountSettings() {
    return (
        <div>
            <h1 className="text-xl font-bold mb-6 text-foreground">Paramètres du compte</h1>

            <div className="bg-card p-6 rounded-2xl border border-border shadow space-y-4">


                <div>
                    <label className="text-sm font-medium text-foreground">Nom</label>
                    <input
                        defaultValue={fakeUser.fullName}
                        className="w-full border border-border bg-muted rounded-lg p-2 mt-1 text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                        defaultValue={fakeUser.email}
                        className="w-full border border-border bg-muted rounded-lg p-2 mt-1 text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground">Téléphone</label>
                    <input
                        defaultValue={fakeUser.phone}
                        className="w-full border border-border bg-muted rounded-lg p-2 mt-1 text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>


                <div className="pt-4">
                    <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-primary/20">
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
}
