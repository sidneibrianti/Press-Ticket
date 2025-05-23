import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";

interface ExtraInfo {
  id?: number;
  name: string;
  value: string;
}
interface ContactData {
  email?: string;
  number?: string;
  address?: string;
  name?: string;
  extraInfo?: ExtraInfo[];
}

interface Request {
  contactData: ContactData;
  contactId: string;
}

const UpdateContactService = async ({
  contactData,
  contactId
}: Request): Promise<Contact> => {
  const { email, address, name, number, extraInfo } = contactData;

  const contact = await Contact.findOne({
    where: { id: contactId },
    attributes: [
      "id",
      "name",
      "number",
      "address",
      "email",
      "profilePicUrl",
      "messengerId",
      "instagramId",
      "telegramId",
      "webchatId"
    ],
    include: ["extraInfo"]
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  if (extraInfo) {
    await Promise.all(
      extraInfo.map(async info => {
        await ContactCustomField.upsert({ ...info, contactId: contact.id });
      })
    );

    await Promise.all(
      contact.extraInfo.map(async oldInfo => {
        const stillExists = extraInfo.findIndex(info => info.id === oldInfo.id);

        if (stillExists === -1) {
          await ContactCustomField.destroy({ where: { id: oldInfo.id } });
        }
      })
    );
  }

  await contact.update({
    name,
    number,
    address,
    email
  });

  await contact.reload({
    attributes: [
      "id",
      "name",
      "number",
      "address",
      "email",
      "profilePicUrl",
      "messengerId",
      "instagramId",
      "telegramId",
      "webchatId"
    ],
    include: ["extraInfo"]
  });

  return contact;
};

export default UpdateContactService;
