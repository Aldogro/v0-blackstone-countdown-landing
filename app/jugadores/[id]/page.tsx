"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RegisteredPlayer } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Chart from "./chart";

const JugadorPage = ({ params }: { params: Promise<{ id: string }> }) => {
    const router = useRouter();
    const { id } = use(params);
    const [player, setPlayer] = useState<RegisteredPlayer | null>(null);
    const [formData, setFormData] = useState({
      name: '',
      alias: '',
      description: '',
      serve: 0,
      forehand: 0,
      backhand: 0,
      forehandVolley: 0,
      backhandVolley: 0,
      lob: 0,
      wallExit: 0,
      bandeja: 0,
      vibora: 0,
      footwork: 0,
      stamina: 0,
      focus: 0,
      mental: 0,
      overall: 0,
      image: '',
    });

  useEffect(() => {
    fetchPlayer();
  }, [id]);

  async function fetchPlayer() {
    const res = await fetch(`/api/players/${id}`);
    const data = await res.json();
    setPlayer(data);
    setFormData({
        ...formData,
        ...data,
    });
  }

  async function handleUpdatePlayer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      const updatedPlayer = await res.json();
      router.push('/jugadores')
    } else {
      console.error('Error updating player:', res.statusText);
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: parseInt(e.target.value) });
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/jugadores">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                   <h1 className="text-2xl md:text-3xl font-light tracking-tight">Jugador</h1>
                </div>
            </div>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle>{player?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePlayer} className="space-y-6">
                        <div className="space-y-4 grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <Chart data={formData} />
                            </div>
                            <div className="col-span-2 md:col-span-1 space-y-4">
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleTextChange}
                                    placeholder="Nombre"
                                />
                                <Input
                                    id="alias"
                                    name="alias"
                                    value={formData.alias}
                                    onChange={handleTextChange}
                                    placeholder="Alias"
                                />
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleTextChange}
                                    placeholder="Descripción"
                                />
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <Input
                                        name="serve"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.serve}
                                        onChange={handleNumberChange}
                                        placeholder="Saque"
                                    />
                                    <Input
                                        id="forehand"
                                        name="forehand"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.forehand}
                                        onChange={handleNumberChange}
                                        placeholder="Drive"
                                    />
                                    <Input
                                        id="backhand"
                                        name="backhand"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.backhand}
                                        onChange={handleNumberChange}
                                        placeholder="Revés"
                                    />
                                    <Input
                                        id="forehandVolley"
                                        name="forehandVolley"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.forehandVolley}
                                        onChange={handleNumberChange}
                                        placeholder="Volea Drive"
                                    />
                                    <Input
                                        id="backhandVolley"
                                        name="backhandVolley"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.backhandVolley}
                                        onChange={handleNumberChange}
                                        placeholder="Volea Revés"
                                    />
                                    <Input
                                        id="lob"
                                        name="lob"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.lob}
                                        onChange={handleNumberChange}
                                        placeholder="Globo"
                                    />
                                    <Input
                                        id="wallExit"
                                        name="wallExit"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.wallExit}
                                        onChange={handleNumberChange}
                                        placeholder="Salida de pared"
                                    />
                                    <Input
                                        id="bandeja"
                                        name="bandeja"
                                        value={formData.bandeja}
                                        onChange={handleNumberChange}
                                        placeholder="Bandeja"
                                    />
                                    <Input
                                        id="vibora"
                                        name="vibora"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.vibora}
                                        onChange={handleNumberChange}
                                        placeholder="Víbora"
                                    />
                                    <Input
                                        id="footwork"
                                        name="footwork"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.footwork}
                                        onChange={handleNumberChange}
                                        placeholder="Movilidad"
                                    />
                                    <Input
                                        id="stamina"
                                        name="stamina"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.stamina}
                                        onChange={handleNumberChange}
                                        placeholder="Resistencia"
                                    />
                                    <Input
                                        id="focus"
                                        name="focus"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={formData.focus}
                                        onChange={handleNumberChange}
                                        placeholder="Enfoque"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 grid grid-cols-1 gap-4">
                        </div>
                        <Button type="submit" className="w-full">
                            Actualizar Jugador
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    </main>
  );
};

export default JugadorPage;
