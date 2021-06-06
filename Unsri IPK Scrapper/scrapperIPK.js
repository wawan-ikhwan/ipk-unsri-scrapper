const fs=require('fs');
const http=require('http');
const xpath=require('xpath-html');
const userInput=require('readline-sync');

const opsi={ //pilihan user input
    //default
    'nama':"ujang",
    'prodi':'hwhwh',
    'angkatan':'2020',
    'nim':'09011282025077'
};

function downloadProdi(){
    return new Promise((resolve,reject)=>{
        http.get('http://old.unsri.ac.id/?act=daftar_mahasiswa',res=>{
            data='';
            res.on('data',d=>{
                data+=d;
            });

            res.on('close',()=>{
                resolve(data.toString());
            });
        }).end();
    })
}

function ambilProdi(html){
    const node=xpath.fromPageSource(html).findElements("//b[contains(text(), 'Fakultas')]");
    const newNode=node.map(item=>item.getText());
    return newNode;
}

function ambilLinkMhs(html){ //mengembalikan URL tanpa argumen angkatan
    node=xpath.fromPageSource(html).findElements('//a[contains(@href,"fak_prodi")]');
    linkProdi=[];
    for (let i=0; i<node.length; i++){
        if(i%13==0){
            let length=node[i].getAttribute('href').length-1
            dummy=node[i].getAttribute('href').slice(0,length-3);
            linkProdi.push(dummy);
        }
    }
    return linkProdi;
}

function printProdi(arr){
    arr.forEach((item,nomor)=>{
        console.log((nomor+": ").padStart(5,' ')+item);
    });
};

function downloadNIM(URL){
    return new Promise((resolve,reject)=>{
        http.get('http://old.unsri.ac.id/'+URL,res=>{
            data='';
            res.on('data',chunk=>{
                data+=chunk;
            })

            res.on('close',()=>{
                resolve(data.toString());
            })

        }).end();
    });
};

function hasNumbers(t){
    var regex = /\d/g;
    return regex.test(t);
} 

function hasLetters(t){
    const regExp = /[a-zA-Z]/g;
    const testString = t;
                
    if(regExp.test(testString)){
        return true;
    } else {
        return false;
    }
}

function ambilNamaMhs(html){
    const node=xpath.fromPageSource(html).findElements('//td[contains(@style,"999999")]');
    const mhs=[];
    let dummy='';
    for (let i=0; i<node.length; i++){
        dummy=node[i].getText().trim();
        if(dummy!='' && !hasNumbers(dummy) && !dummy.includes('AKTIF') && !dummy.includes('-') && !dummy.includes('PAKET') && !dummy.includes('Paket')){
            mhs.push(dummy);
        }
    }
    return mhs;
}

function ambilNIM(html,bentuk='TEXT'){
    const node=xpath.fromPageSource(html).findElements('//a[contains(@href,"?act=detil")]');
    const nim=[];
    const link=[];
    let dummy='';
    for (let i=0; i<node.length; i++){
        dummy=node[i].getText().trim();
        if(dummy!='' && !hasLetters(dummy)){
            link.push(node[i].getAttribute('href'));
            nim.push(dummy);
        }
    }
    if(bentuk=='URL'){
        return link;
    } else{
        return nim;
    }
}

function printMahasiswa(nim,nama){
    let buff='';
    for (let i=0; i<nama.length; i++){
        buff=(i+": ").padStart(5,' ')+nim[i].padEnd(17," ")+"  ->  "+nama[i].padEnd(40," ");
        console.log(buff);
    }
}

function downloadIPK(urlIPK){
    return new Promise((resolve,reject)=>{
        http.get('http://old.unsri.ac.id/'+urlIPK,res=>{
            data='';
            res.on('data',chunk=>{
                data+=chunk;
            });
            res.on('close',()=>{
                resolve(data.toString());
            });
        });
    });
}

function printIPK(html){
    const node=xpath.fromPageSource(html).findElements('//table[@class="table-common"]');
    const newNode=xpath.fromNode(node).findElements('//td');
    let foo ='NO.|        KODE        |                          MATA KULIAH                       |HM|AM| K| M|\n';
        foo+='--------------------------------------------------------------------------------------------------';
    for (let i=0; i<newNode.length; i++){
        if(i%7==0){
            foo+='\n';
            pad=3;
        }else if(i%7==1){
            pad=20;
        }else if(i%7==2){
            pad=60;
        }else if(i%7==3){
            pad=2;
        }else if(i%7==4){
            pad=2;
        }else if(i%7==5){
            pad=2;
        }else if(i%7==6){
            pad=2;
        }
        foo2=newNode[i].getText()+'';
        if(foo2!='undefined'){
            foo+=foo2.trim().padStart(pad,' ')+"|";
        }
    }
    const nodeIPK=xpath.fromPageSource(html).findElement('//p[contains(text(),"(IPK)")]');
    const newNodeIPK=xpath.fromNode(nodeIPK).findElement('//b');
    foo2=nodeIPK.getText()+'';
    foo+=foo2.trim();
    foo2=newNodeIPK.getText()+'';
    foo+=foo2.trim();
    return foo;
}

console.log('Sedang mengambil Prodi...');
downloadProdi().then((html)=>{
    prodi=ambilProdi(html); //array
    printProdi(prodi);
    noProdi=userInput.question('Pilih No. Urut Prodi: ');
    opsi.prodi=prodi[noProdi]
    console.log(prodi[noProdi]);
    opsi.angkatan=userInput.question('Pilih Angkatan: ');
    console.log('Sedang mengambil NIM...');
    urlProdi=ambilLinkMhs(html); //array
    urlNIM=urlProdi[noProdi]+opsi.angkatan;
    downloadNIM(urlNIM).then(body=>{
        nama=ambilNamaMhs(body);
        nim=ambilNIM(body,'text');
        urlMhs=ambilNIM(body,'URL');
        printMahasiswa(nim,nama);
        posisiMhs=userInput.question('Pilih No. Urut Mahasiswa: ');
        opsi.nim=nim[posisiMhs];
        opsi.nama=nama[posisiMhs];
        console.log(opsi.nama+' ('+opsi.nim+')');
        urlIPK=urlMhs[posisiMhs].replace('detil_','detil_transkrip_');
        console.log('Sedang mengambil IPK...')
        downloadIPK(urlIPK).then(bodyIPK=>{
            console.log(printIPK(bodyIPK));
        });
    });
});