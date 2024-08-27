import React, { useState } from "react";
import './XMLProcessor.css';

const XMLProcessor = () => {
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [anoAtual, setAnoAtual] = useState(2024);
    const [files, setFiles] = useState([]);

    const handleFileUpload = (event) => {
        setFiles(event.target.files);
    };

    const handleAnalyzeFiles = () => {
        if (files.length === 0) {
            setError("Nenhum arquivo selecionado");
            return;
        }

        setResults([]);
        setError(null);

        let fileCount = files.length;
        let processedCount = 0;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const xmlData = e.target.result;
                const result = processXML(xmlData, file.name);
                setResults(prevResults => [...prevResults, { fileName: file.name, ...result }]);
                processedCount += 1;
                if (processedCount === fileCount) {
                    console.log("Todos os arquivos processados.");
                }
            };
            reader.onerror = () => {
                setError("Erro ao ler o arquivo");
                setResults(prevResults => [...prevResults, { fileName: file.name, artigos: 0, orientacoes: 0, nome: "", error: "Erro ao ler o arquivo" }]);
                processedCount += 1;
                if (processedCount === fileCount) {
                    console.log("Todos os arquivos processados com erro.");
                }
            };
            reader.readAsText(file);
        });
    };

    const processXML = (xmlData, fileName) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, "text/xml");

            let contadorArtigos = 0;
            let contadorOrientacoes = 0;

            let nomePessoa = xmlDoc.getElementsByTagName("DADOS-GERAIS")[0].getAttribute("NOME-COMPLETO") || "";

            const artigos = xmlDoc.getElementsByTagName("ARTIGO-PUBLICADO");
            for (let i = 0; i < artigos.length; i++) {
                const ano = artigos[i]
                    .getElementsByTagName("DADOS-BASICOS-DO-ARTIGO")[0]
                    .getAttribute("ANO-DO-ARTIGO");
                if (ano && parseInt(ano) >= (anoAtual - 5)) {
                    contadorArtigos += 1;
                }
            }

            const tiposOrientacao = [
                "ORIENTACAO-EM-ANDAMENTO-DE-MESTRADO",
                "ORIENTACAO-EM-ANDAMENTO-DE-DOUTORADO",
                "ORIENTACAO-EM-ANDAMENTO-DE-GRADUACAO",
                "ORIENTACAO-EM-ANDAMENTO-DE-INICIACAO-CIENTIFICA",
            ];

            tiposOrientacao.forEach((tipo) => {
                const orientacoes = xmlDoc.getElementsByTagName(tipo);
                for (let i = 0; i < orientacoes.length; i++) {
                    const ano = orientacoes[i]
                        .getElementsByTagName(`DADOS-BASICOS-DA-${tipo}`)[0]
                        .getAttribute("ANO");
                    if (ano && parseInt(ano) >= (anoAtual - 5)) {
                        contadorOrientacoes += 1;
                    }
                }
            });

            return { artigos: contadorArtigos, orientacoes: contadorOrientacoes, nome: nomePessoa };
        } catch (err) {
            console.error("Erro ao processar o XML: ", err);
            setError("Erro ao processar o XML: " + err.message);
            return { artigos: 0, orientacoes: 0, nome: "", error: "Erro ao processar o XML: " + err.message };
        }
    };

    const exportToCSV = () => {
        const csvRows = [];
        csvRows.push(["Arquivo", "Nome", "Artigos", "Orientações"].join(","));

        results.forEach(result => {
            const { fileName, nome, artigos, orientacoes, error } = result;
            csvRows.push([
                fileName,
                nome || "N/A",
                error ? "Erro" : artigos,
                error ? "Erro" : orientacoes
            ].join(","));
        });

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "resultados.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg">
            <h1>Rank Lattes</h1>
            <div className="line-input">
                <label className="text" htmlFor="anoInput">Insira o ano:</label>
                <input
                    type="number"
                    id="anoInput"
                    value={anoAtual}
                    onChange={(e) => setAnoAtual(parseInt(e.target.value))}
                    placeholder="Ex: 2023"
                />
            </div>
            <br />
            <div className="line-input">
                <input
                    type="file"
                    accept=".xml"
                    multiple
                    onChange={handleFileUpload}
                />
            </div>
            <br />
            <div>
                <button className="btn btn-masterful" onClick={handleAnalyzeFiles}>
                    <span className="icon">&#x2699;</span>
                    <span className="btn-txt">Analisar Arquivos</span>
                </button>
            </div>
            <br />
            {error && <p style={{ color: "red" }}>{error}</p>}
            {results.length > 0 && (
                <div>
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Arquivo</th>
                                <th>Nome</th>
                                <th>Artigos ({anoAtual - 5} - {anoAtual})</th>
                                <th>Orientações ({anoAtual - 5} - {anoAtual})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, index) => (
                                <tr key={index}>
                                    <td>{result.fileName}</td>
                                    <td>{result.nome || "N/A"}</td>
                                    <td>{result.error ? "Erro" : result.artigos}</td>
                                    <td>{result.error ? "Erro" : result.orientacoes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            )}
            <br />
            <button className="btn btn-masterful" onClick={exportToCSV}>
                <span className="icon">&#x1F4C4;</span>
                <span className="btn-txt">Exportar CSV</span>
            </button>
        </div>
    );
};

export default XMLProcessor;
