# Dropzone Bileşeni

Bu proje, dosya yükleme işlemleri için kullanılan bir React bileşeni olan Dropzone'u içermektedir. Dropzone bileşeni, dosya yükleme, reddetme, kabul etme ve doğrulama işlemlerini kolayca yönetebilmenize olanak sağlar.

## Özellikler

- **Dosya Yükleme**: Kullanıcılar dosyalarını sürükleyip bırakabilir ya da dosya seçme penceresinden dosya yükleyebilirler.
- **Dosya Kabul Etme ve Reddetme**: Yüklenen dosyaların kabul edilip reddedilmesi işlemleri yapılır.
- **Dosya Doğrulama**: Dosya türü, boyutu ve sayısı doğrulanır.
- **Çoklu Dosya Desteği**: Birden fazla dosya yükleme desteği sağlar.
- **Özelleştirilmiş Hata Mesajları**: Geçersiz dosya türü, dosya boyutu ve sayısı ile ilgili özelleştirilmiş hata mesajları görüntülenebilir.

## Kullanım

```tsx
import { Dropzone } from "react-dropzone-kit";

const App = () => {
  const handleDrop = (acceptedFiles, rejections) => {
    console.log("Kabul Edilen Dosyalar:", acceptedFiles);
    console.log("Reddedilen Dosyalar:", rejections);
  };

  return (
    <Dropzone
      multiple={true}
      acceptedFormats={["image/png", "image/jpeg"]}
      maxFiles={3}
      maxSize={1024 * 1024 * 5} // 5 MB
      minSize={1024} // 1 KB
      onDrop={(acceptedFiles, rejections) => handleDrop(acceptedFiles, rejections)}
    >
      {({ containerProps, inputProps, handleFileDelete, isDragActive }) => (
        <div {...containerProps} className={`dropzone ${isDragActive ? "active" : ""}`}>
          <input {...inputProps} />
          <p>Dosyaları buraya sürükleyin veya seçmek için tıklayın.</p>
        </div>
      )}
    </Dropzone>
  );
};

```

### Ön Gereksinimler

react@19.x.x, react-dom@19.x.x


### Kurulum

Projenize bu Dropzone bileşenini dahil etmek için aşağıdaki adımları takip edebilirsiniz:

- Projeyi yükleyin:

  ```bash
  npm install react-dropzone-kit

  ```

- Dropzone bileşenini React projenize import Edin:
  ```tsx
  import { Dropzone } from "react-dropzone-kit";
  ```

## Prop Adları

| Prop Adı             | Tür                                                                                            | Varsayılan | Açıklama                                        |
| -------------------- | ---------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------- |
| `onDrop`             | `(files: File[], rejections: IFileRejection[]) => void`                                        | -          | Geçerli ve reddedilen dosyaları döndüren işlev. |
| `onDropRejected`     | `(rejections: IFileRejection[]) => void`                                                       | -          | Reddedilen dosyaları sağlayan işlev.            |
| `onDropAccepted`     | `(files: File[]) => void`                                                                      | -          | Kabul edilen dosyaları sağlayan işlev.          |
| `multiple`           | `boolean`                                                                                      | `true`     | Birden fazla dosya yüklenmesine izin verir.     |
| `acceptedFormats`    | `string[]`                                                                                     | ["/"]      | Kabul edilen dosya türleri.                     |
| `maxFiles`           | `number`                                                                                       | -          | Maksimum yüklenebilir dosya sayısı.             |
| `maxSize`            | `number`                                                                                       | -          | Yüklenebilir maksimum dosya boyutu (byte).      |
| `minSize`            | `number`                                                                                       | -          | Yüklenebilir minimum dosya boyutu (byte).       |
| `validationMessages` | `IFileError[]`                                                                                 | `validationMessages`          | Özel hata mesajları.                            |
| `children`           | `({ containerProps, inputProps, handleFileDelete, isDragActive }) => JSX.Element`              | Zorunlu    | Özelleştirilebilir içerik işlevi.               |
| `initialFiles`       | `File[]`                                                                                       | -          | Başlangıç dosyalarını belirler.

### `children` Prop'u Açıklaması

Dropzone bileşeni, içerik düzenini özelleştirmek için `children` prop'unu kullanmanıza olanak tanır. Bu prop, bileşenin içeriğini özelleştirmek için bir fonksiyon alır ve bu fonksiyon aşağıdaki parametreleri döndürür:

| Parametre          | Tür                                 | Açıklama                                                                             |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `containerProps`   | `ReactHTMLProps<HTMLDivElement>`    | Dropzone bileşeninin ana konteynerine uygulanması gereken HTML özelliklerini içerir. |
| `inputProps`       | `React.HTMLProps<HTMLInputElement>` | Dosya yükleme input elemanına uygulanması gereken HTML özelliklerini içerir.         |
| `handleFileDelete` | `(file:File) => void`               | Yüklenen dosyayı silmek için kullanılan işlevi temsil eder.                          |
| `isDragActive`     | `boolean`                           | Dropzone drag durumunu dönderir                                                      |

## Callback İşlevleri

- **onDrop**: Kullanıcı dosya yüklediğinde kabul edilen ve reddedilen dosyalarla birlikte çağrılır.
- **onDropAccepted**: Kabul edilen dosyalarla birlikte çağrılır.
- **onDropRejected**: Reddedilen dosyalarla birlikte çağrılır.

## Özelleştirme

Bileşen tamamen özelleştirilebilir şekilde tasarlanmıştır. `children` prop'u, içerik düzenini ve tasarımını istediğiniz gibi yapılandırmanıza olanak tanır.

## Kullanıcı Etkileşimleri

- Dosyaları sürükleyip bırakma.
- Dosya seçmek için input tıklama.
- Yüklenen dosyaları listeleme ve silme.

## Önemli Notlar

- `validator` işlevi, dosyaların geçerliliğini kontrol eder ve ilgili hataları döndürür.
- Varsayılan doğrulama mesajlarını özelleştirmek için `validationMessages` prop'u kullanılabilir.
- `varsayılan doğrulama mesajları` içeriği:

```tsx
[
		{
			code: "file-invalid-type",
			message: `Geçersiz dosya türü. Sadece şu türler destekleniyor: ${acceptedFormats.join(", ")}.`,
		},
		{
			code: "file-too-large",
			message: "Dosya boyutu çok büyük.",
		},
		{
			code: "file-too-small",
			message: "Dosya boyutu çok küçük.",
		},
		{
			code: "too-many-files",
			message: `Maksimum dosya sayısını aştınız. En fazla ${maxFiles} dosya yükleyebilirsiniz.`,
		},
	]
```

- Aynı isimdeki dosyalar filtrelenir, böylece yinelenen dosyalar yüklenmez.

## Geliştirme

Bileşen, React'in `useState` ve `useEffect` gibi temel hook'ları kullanılarak geliştirilmiştir.

Dosya yükleme mantığı, drag-and-drop işlemlerini ve input üzerinden dosya seçimini destekleyecek şekilde tasarlanmıştır. Validasyon ve hata işleme, kullanıcı deneyimini geliştirmek için dahili olarak işlenir.
