import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GithubConfig {
  token: string;
  repo: string;
  branch: string;
}

export default function AdminFlashcard() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<GithubConfig>({
    token: "",
    repo: "Dafaairpanas/mykaado",
    branch: "main"
  });
  const [filePath, setFilePath] = useState("src/data/kanji/iroa1.json");
  const [fileSha, setFileSha] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<string>("");

  useEffect(() => {
    const savedToken = localStorage.getItem("github_pat");
    if (savedToken) setConfig(prev => ({ ...prev, token: savedToken }));
    
    const auth = localStorage.getItem("admin_auth");
    if (auth !== "true") {
      navigate("/adminadit/login");
    }
  }, [navigate]);

  const saveToken = (token: string) => {
    setConfig(prev => ({ ...prev, token }));
    localStorage.setItem("github_pat", token);
  };

  const loadFile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`https://api.github.com/repos/${config.repo}/contents/${filePath}?ref=${config.branch}`, {
        headers: {
          "Authorization": `token ${config.token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (response.status === 404) {
        setFileSha("");
        setData([]);
        setSuccess("File belum ada di GitHub. Anda sedang membuat file baru. Data awal kosong.");
        return;
      }
      if (!response.ok) throw new Error("Gagal mengambil file. Pastikan token dan path benar.");
      const result = await response.json();
      setFileSha(result.sha);
      
      const content = decodeURIComponent(escape(atob(result.content)));
      const parsed = JSON.parse(content);
      setData(Array.isArray(parsed) ? parsed : []);
      setSuccess("File berhasil dimuat!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const commitFile = async () => {
    if (!confirm("Yakin ingin commit perubahan ini ke GitHub?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const contentStr = JSON.stringify(data, null, 2);
      const encoded = btoa(unescape(encodeURIComponent(contentStr)));
      
      const bodyPayload: any = {
        message: `Update ${filePath} via Admin Dashboard`,
        content: encoded,
        branch: config.branch
      };
      if (fileSha) {
        bodyPayload.sha = fileSha;
      }
      
      const response = await fetch(`https://api.github.com/repos/${config.repo}/contents/${filePath}`, {
        method: "PUT",
        headers: {
          "Authorization": `token ${config.token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal melakukan commit.");
      }
      
      const result = await response.json();
      setFileSha(result.content.sha); // Update SHA
      setSuccess("Berhasil commit ke GitHub!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm(JSON.stringify(data[index], null, 2));
  };

  const handleSaveEdit = () => {
    try {
      const parsed = JSON.parse(editForm);
      const newData = [...data];
      if (editingIndex !== null && editingIndex >= 0) {
        newData[editingIndex] = parsed;
      } else {
        newData.push(parsed);
      }
      setData(newData);
      setEditingIndex(null);
      setEditForm("");
    } catch (err) {
      alert("JSON tidak valid!");
    }
  };

  const handleDelete = (index: number) => {
    if (confirm("Hapus baris ini?")) {
      const newData = [...data];
      newData.splice(index, 1);
      setData(newData);
    }
  };

  const handleAdd = () => {
    const template = data.length > 0 ? Object.keys(data[0]).reduce((acc, key) => ({ ...acc, [key]: "" }), {}) : { id: "" };
    setEditForm(JSON.stringify(template, null, 2));
    setEditingIndex(-1); // -1 signifies new item
  };

  const filteredData = data.map((item, originalIndex) => ({ item, originalIndex })).filter(({ item }) => {
    if (!search) return true;
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(search.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2">Admin Flashcard JSON</h1>
          <p className="text-[var(--color-text-muted)]">CRUD dan Commit langsung ke GitHub</p>
        </div>
        <Button variant="default" onClick={() => navigate("/adminadit")}>Kembali</Button>
      </div>

      <Card className="p-6 mb-6 flex flex-col gap-4">
        <h2 className="font-bold text-xl">1. Konfigurasi GitHub</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">GitHub PAT (Token)</label>
            <input type="password" value={config.token} onChange={e => saveToken(e.target.value)} className="w-full p-2 rounded bg-[var(--color-bg-nav)] border border-[var(--color-border-main)]" placeholder="ghp_..." />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Repository (owner/repo)</label>
            <input type="text" value={config.repo} onChange={e => setConfig(prev => ({ ...prev, repo: e.target.value }))} className="w-full p-2 rounded bg-[var(--color-bg-nav)] border border-[var(--color-border-main)]" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Branch</label>
            <input type="text" value={config.branch} onChange={e => setConfig(prev => ({ ...prev, branch: e.target.value }))} className="w-full p-2 rounded bg-[var(--color-bg-nav)] border border-[var(--color-border-main)]" />
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="font-bold text-xl mb-4">2. Load File</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-bold mb-1">File Path di Repo (cth: src/data/kanji/iroa1.json)</label>
            <input type="text" value={filePath} onChange={e => setFilePath(e.target.value)} className="w-full p-2 rounded bg-[var(--color-bg-nav)] border border-[var(--color-border-main)]" />
          </div>
          <Button variant="primary" onClick={loadFile} disabled={loading || !config.token}>Load Data</Button>
        </div>
        {error && <p className="text-red-500 font-bold mt-2">{error}</p>}
        {success && <p className="text-green-500 font-bold mt-2">{success}</p>}
      </Card>

      {data.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-xl">3. Edit Data ({data.length} item)</h2>
            <Button variant="danger" onClick={commitFile} disabled={loading}>Commit ke GitHub</Button>
          </div>
          
          <div className="flex justify-between mb-4 gap-4">
            <input 
              type="text" 
              placeholder="Cari data..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="flex-1 p-2 rounded bg-[var(--color-bg-nav)] border border-[var(--color-border-main)]"
            />
            <Button variant="primary" onClick={handleAdd}>+ Tambah Baru</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-[length:var(--bw-sm)] border-[var(--color-border-main)]">
                  <th className="p-2">Data (JSON)</th>
                  <th className="p-2 w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(({ item, originalIndex }) => (
                  <tr key={originalIndex} className="border-b-[length:var(--bw-sm)] border-[var(--color-border-main)]/50 hover:bg-[var(--color-bg-nav)] transition-colors">
                    <td className="p-2 max-w-[600px] truncate">
                      <pre className="text-xs m-0 whitespace-pre-wrap font-mono">{JSON.stringify(item, null, 1).replace(/[{}]/g, '').trim()}</pre>
                    </td>
                    <td className="p-2 flex flex-col gap-2">
                      <Button variant="default" className="w-full py-1 text-sm" onClick={() => handleEdit(originalIndex)}>Edit</Button>
                      <Button variant="danger" className="w-full py-1 text-sm bg-red-500 text-white" onClick={() => handleDelete(originalIndex)}>Hapus</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl flex flex-col h-[80vh]">
            <div className="p-4 border-b border-[var(--color-border-main)] flex justify-between items-center">
              <h2 className="font-bold text-xl">{editingIndex >= 0 ? 'Edit Item' : 'Tambah Item'}</h2>
              <button onClick={() => setEditingIndex(null)} className="font-bold">X</button>
            </div>
            <div className="p-4 flex-1 flex flex-col overflow-hidden">
              <p className="text-sm mb-2 text-[var(--color-text-muted)]">Edit format JSON di bawah ini (pastikan strukturnya valid):</p>
              <textarea 
                value={editForm}
                onChange={e => setEditForm(e.target.value)}
                className="flex-1 w-full p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] rounded custom-scrollbar"
                spellCheck={false}
              />
            </div>
            <div className="p-4 border-t border-[var(--color-border-main)] flex justify-end gap-2">
              <Button variant="default" onClick={() => setEditingIndex(null)}>Batal</Button>
              <Button variant="primary" onClick={handleSaveEdit}>Simpan ke Tabel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
