let toHighlight = [];

if ((matchField === 'NUMERO_DOCUMENTO' || matchField === 'codigo' || matchField === 'NOMBRE') && matchValue) {
  const mv = norm(matchValue);

  toHighlight = features.filter((f) => {
    const p = f.properties || {};
    const v =
      matchField === 'NUMERO_DOCUMENTO' ? p.NUMERO_DOCUMENTO :
      matchField === 'codigo' ? p.codigo :
      p.NOMBRE;

    return norm(v) === mv; // ✅ EXACTO para NOMBRE (no "includes", para evitar pintar de más)
  });
}
