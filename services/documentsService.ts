import { DealDocument, User, UserRole } from '../types';
import { supabase } from './supabaseClient';

const DOCUMENTS_BUCKET = 'deal-documents';

const sanitizeFileName = (name: string) => name.replace(/[^\w.-]+/g, '_');

const mapDealDocument = (row: any): DealDocument => {
  const publicUrl = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(row.arquivo_path).data.publicUrl;

  return {
    id: row.id,
    dealId: row.lead_id,
    name: row.nome_documento,
    documentDate: row.data_documento,
    filePath: row.arquivo_path,
    fileName: row.arquivo_nome || '',
    fileType: row.arquivo_tipo || '',
    fileSize: Number(row.arquivo_tamanho || 0),
    fileUrl: publicUrl,
    createdAt: row.created_at,
    uploadedBy: row.uploaded_by || undefined
  };
};

export class DocumentsService {
  async getDealDocuments(dealId: string): Promise<DealDocument[]> {
    const { data, error } = await supabase
      .from('documentos_negocio')
      .select('*')
      .eq('lead_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDealDocument);
  }

  async uploadDealDocument(
    dealId: string,
    payload: { name: string; documentDate: string; file: File },
    requestingUser: User
  ): Promise<DealDocument> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem enviar documentos.');
    }

    const safeFileName = sanitizeFileName(payload.file.name);
    const filePath = `${dealId}/${Date.now()}_${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, payload.file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('documentos_negocio')
      .insert({
        lead_id: dealId,
        nome_documento: payload.name,
        data_documento: payload.documentDate,
        arquivo_path: filePath,
        arquivo_nome: payload.file.name,
        arquivo_tipo: payload.file.type,
        arquivo_tamanho: payload.file.size,
        uploaded_by: requestingUser.id,
        org_id: requestingUser.orgId || null
      })
      .select('*')
      .single();

    if (error) throw error;

    return mapDealDocument(data);
  }

  async updateDealDocument(
    documentId: string,
    payload: { name: string; documentDate: string },
    requestingUser: User
  ): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem editar documentos.');
    }

    const { error } = await supabase
      .from('documentos_negocio')
      .update({
        nome_documento: payload.name,
        data_documento: payload.documentDate
      })
      .eq('id', documentId);

    if (error) throw error;
  }

  async deleteDealDocument(documentId: string, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem excluir documentos.');
    }

    const { data, error } = await supabase
      .from('documentos_negocio')
      .select('arquivo_path')
      .eq('id', documentId)
      .single();

    if (error) throw error;

    if (data?.arquivo_path) {
      const { error: storageError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .remove([data.arquivo_path]);

      if (storageError) throw storageError;
    }

    const { error: deleteError } = await supabase
      .from('documentos_negocio')
      .delete()
      .eq('id', documentId);

    if (deleteError) throw deleteError;
  }
}

export const documentsService = new DocumentsService();
