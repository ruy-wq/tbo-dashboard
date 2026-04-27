"""Le TBO_Radar_Prospeccao_Qualificada_v2.xlsx (sheet 'Todos os Contatos')
e exporta JSON com os campos relevantes para tmp_mailchimp/radar-rows.json.

Uso: python frontend/scripts/build-leads-radar.py
"""
import json
import os
import sys
import openpyxl

XLSX = "C:/Users/WIN10/Downloads/TBO_Radar_Prospeccao_Qualificada_v2.xlsx"
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "tmp_mailchimp", "radar-rows.json")


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb["Todos os Contatos"]
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        print("Sem linhas")
        sys.exit(1)
    header_raw = rows[0]
    # Header esperado contem caracteres mojibake — mapear pela posicao.
    # Ordem: Score, Incorporadora, Nicho, Segmento, Perfil, Porte, Validado,
    #        Contato, Telefone, WhatsApp, E-mail, Site, Instagram, Cidade, UF,
    #        Empreendimentos, Preco_Ref, Andares_Med, Unidades_Total,
    #        Cidades_Atuacao, Nicho_Detalhe, Comissao_PJ, Comissao_PF,
    #        Fonte, Status, Notas
    print("Header (primeiros 5):", header_raw[:5])
    out = []
    for r in rows[1:]:
        if not r or not any(r):
            continue
        record = {
            "score": r[0],
            "incorporadora": r[1],
            "nicho": r[2],
            "segmento": r[3],
            "perfil": r[4],
            "porte": r[5],
            "validado": r[6],
            "contato": r[7],
            "telefone": r[8],
            "whatsapp": r[9],
            "email": r[10],
            "site": r[11],
            "instagram": r[12],
            "cidade": r[13],
            "uf": r[14],
            "empreendimentos": r[15],
            "preco_ref": r[16],
            "andares_med": r[17],
            "unidades_total": r[18],
            "cidades_atuacao": r[19],
            "nicho_detalhe": r[20],
            "comissao_pj": r[21],
            "comissao_pf": r[22],
            "fonte": r[23],
            "status": r[24],
            "notas": r[25],
        }
        out.append(record)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    print(f"OK — {len(out)} registros em {OUT}")


if __name__ == "__main__":
    main()
